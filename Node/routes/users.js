const express = require("express");
const router = express.Router();
const AWS = require("aws-sdk");
const crypto = require("crypto");
const pdf = require("pdf-parse");
const translateText = require("../utils/translate.text");
const imageProccesor = require("../utils/analyzer.txt");
const textToSpeech = require("../utils/analyzer.audio");

const db = require("../utils/db");
const authenticateJWT = require("../utils/authJWT");

require("dotenv").config();

// Función para calcular el SECRET_HASH requerido por Cognito cuando hay Client Secret
function calculateSecretHash(username, clientId, clientSecret) {
    return crypto
        .createHmac("SHA256", clientSecret)
        .update(username + clientId)
        .digest("base64");
}

AWS.config.update({ region: process.env.AWS_REGION });
const cognito = new AWS.CognitoIdentityServiceProvider();
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

router.post("/signup", async (req, res) => {
    const { first_name, last_name, email, birth_date, password, picture } =
        req.body;

    if (
        !first_name ||
        !last_name ||
        !email ||
        !birth_date ||
        !password ||
        !picture
    ) {
        return res.status(400).json({ err: "Missing required fields" });
    }

    try {
        let params = {
            ClientId: process.env.AWS_CLIENT_ID,
            Password: password,
            Username: email,
            SecretHash: calculateSecretHash(
                email,
                process.env.AWS_CLIENT_ID,
                process.env.AWS_CLIENT_SECRET
            ),
        };

        const data = await cognito.signUp(params).promise();

        const picBuffer = Buffer.from(
            picture.replace(/^data:image\/\w+;base64,/, ""),
            "base64"
        );
        params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `imagenes/${email}-${Date.now()}.jpg`,
            Body: picBuffer,
            ContentType: "image/jpeg",
        };

        const s3Data = await s3.upload(params).promise();
        const pictureUrl = s3Data.Location;

        const query =
            "INSERT INTO USUARIO (NOMBRE, APELLIDO, CORREO, FECHA_NACIMIENTO, FOTO) VALUES (?, ?, ?, ?, ?)";
        await db.query(query, [
            first_name,
            last_name,
            email,
            birth_date,
            pictureUrl,
        ]);
        res.json(data);
    } catch (err) {
        console.log(err);
        res.status(400).json({ err: err.message });
    }
});

router.post("/confirm", (req, res) => {
    const { email, code } = req.body;

    const params = {
        ClientId: process.env.AWS_CLIENT_ID,
        ConfirmationCode: code,
        Username: email,
        SecretHash: calculateSecretHash(
            email,
            process.env.AWS_CLIENT_ID,
            process.env.AWS_CLIENT_SECRET
        ),
    };

    cognito.confirmSignUp(params, (err, data) => {
        if (err) {
            console.log(err);
            if (err.code === "LimitExceededException") {
                return res
                    .status(429)
                    .json({
                        err: "Too many attempts. Please try again later.",
                    });
            }
            return res.status(400).json({ err: err.message });
        } else {
            res.json(data);
        }
    });
});

router.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    const params = {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.AWS_CLIENT_ID,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
            SECRET_HASH: calculateSecretHash(
                email,
                process.env.AWS_CLIENT_ID,
                process.env.AWS_CLIENT_SECRET
            ),
        },
    };

    try {
        const data = await cognito.initiateAuth(params).promise();
        const idToken = data.AuthenticationResult.IdToken;
        const accessToken = data.AuthenticationResult.AccessToken;
        const [row] = await db.query("SELECT * FROM USUARIO WHERE CORREO = ?", [
            email,
        ]);
        if (row.length === 0) {
            throw new Error("User not found in database");
        }
        const user = {
            id: row[0].ID,
            first_name: row[0].NOMBRE,
            last_name: row[0].APELLIDO,
            email: row[0].CORREO,
            birth_date: row[0].FECHA_NACIMIENTO,
            picture: row[0].FOTO,
            cv: row[0].CV || null,
            admin: row[0].ADMIN,
        };
        res.json({ idToken, accessToken, user });
    } catch (err) {
        console.log(err);
        res.status(400).json({ err: err.message });
    }
});

router.get("/user", authenticateJWT, (req, res) => {
    res.json({ message: "Welcome to the protected route!" });
});

router.post("/signout", authenticateJWT, (req, res) => {
    const token = req.body.accessToken;

    const params = {
        AccessToken: token,
    };

    cognito.globalSignOut(params, (err, data) => {
        if (err) {
            console.log(err);
            res.status(400).json({ err: err.message });
        } else {
            res.json({ message: "Successfully signed out!" });
        }
    });
});

router.post("/upload-cv", authenticateJWT, async (req, res) => {
    const { cv, userId } = req.body;

    console.log("=== Inicio de subida de CV ===");
    console.log("User ID recibido:", userId);

    if (!userId) {
        console.error("No se proporcionó el userId");
        return res.status(400).json({ err: "Se requiere el ID del usuario." });
    }

    try {
        // Buscar el usuario por ID para obtener el email (para el nombre del archivo)
        const [userRows] = await db.query(
            "SELECT CORREO FROM USUARIO WHERE ID = ?",
            [userId]
        );

        if (userRows.length === 0) {
            console.error(
                "Usuario no encontrado en la base de datos con ID:",
                userId
            );
            return res
                .status(404)
                .json({ err: "Usuario no encontrado en la base de datos." });
        }

        const email = userRows[0].CORREO;
        console.log("Email del usuario encontrado:", email);
        // Detectar el tipo de archivo (imagen o PDF)
        const isImage = cv.startsWith("data:image/");
        const isPDF = cv.startsWith("data:application/pdf");

        console.log(
            "Tipo de archivo:",
            isImage ? "Imagen" : isPDF ? "PDF" : "Desconocido"
        );

        let cvBuffer, contentType, extension;

        if (isImage) {
            // Es una imagen - extraer texto con Rekognition
            cvBuffer = Buffer.from(
                cv.replace(/^data:image\/\w+;base64,/, ""),
                "base64"
            );

            // Determinar extensión de imagen
            if (cv.startsWith("data:image/png")) {
                contentType = "image/png";
                extension = "png";
            } else if (
                cv.startsWith("data:image/jpeg") ||
                cv.startsWith("data:image/jpg")
            ) {
                contentType = "image/jpeg";
                extension = "jpg";
            } else {
                contentType = "image/jpeg";
                extension = "jpg";
            }

            console.log("Extrayendo texto de la imagen...");
            // Extraer texto con Rekognition
            const extractedText = await imageProccesor.extractText(cvBuffer);

            // Subir imagen a S3
            const s3Key = `cvs/${email}-${Date.now()}.${extension}`;
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                Body: cvBuffer,
                ContentType: contentType,
            };

            console.log("Subiendo a S3:", s3Key);
            const data = await s3.upload(params).promise();
            const cvUrl = data.Location;
            console.log("URL de S3:", cvUrl);

            // Actualizar base de datos usando el ID del usuario
            const query = "UPDATE USUARIO SET CV = ? WHERE ID = ?";
            console.log("Actualizando base de datos con ID:", userId);
            const [result] = await db.query(query, [cvUrl, userId]);
            console.log("Resultado de la actualización:", result);

            // Verificar que se actualizó
            if (result.affectedRows === 0) {
                throw new Error(
                    "No se pudo actualizar el CV en la base de datos. Usuario no encontrado."
                );
            }

            console.log("CV actualizado exitosamente en la base de datos");

            res.json({
                message: "CV uploaded and processed successfully",
                cvUrl: cvUrl,
                extractedText: extractedText,
                success: true,
            });
        } else if (isPDF) {
            // Es un PDF - subir directamente
            cvBuffer = Buffer.from(
                cv.replace(/^data:application\/\w+;base64,/, ""),
                "base64"
            );
            contentType = "application/pdf";
            extension = "pdf";

            const s3Key = `cvs/${email}-${Date.now()}.${extension}`;
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                Body: cvBuffer,
                ContentType: contentType,
            };

            console.log("Subiendo PDF a S3:", s3Key);
            const data = await s3.upload(params).promise();
            const cvUrl = data.Location;
            console.log("URL de S3:", cvUrl);

            // Actualizar base de datos usando el ID del usuario
            const query = "UPDATE USUARIO SET CV = ? WHERE ID = ?";
            console.log("Actualizando base de datos con ID:", userId);
            const [result] = await db.query(query, [cvUrl, userId]);
            console.log("Resultado de la actualización:", result);

            // Verificar que se actualizó
            if (result.affectedRows === 0) {
                throw new Error(
                    "No se pudo actualizar el CV en la base de datos. Usuario no encontrado."
                );
            }

            console.log("CV actualizado exitosamente en la base de datos");

            res.json({
                message: "CV uploaded successfully",
                cvUrl: cvUrl,
                note: "PDF text extraction requires AWS Textract (not implemented)",
                success: true,
            });
        } else {
            return res
                .status(400)
                .json({
                    err: "Invalid file format. Please send image (PNG/JPG) or PDF with base64 data URI",
                });
        }
    } catch (err) {
        console.error("Error al subir CV:", err);
        res.status(400).json({ err: err.message });
    }
});

router.post("/analyzeText", authenticateJWT, async (req, res) => {
    try {
        const { imagen } = req.body;
        if (!imagen) {
            return res.status(400).json({ message: "Imagen no proporcionada" });
        }

        const imageBuffer = Buffer.from(
            imagen.replace(/^data:image\/\w+;base64,/, ""),
            "base64"
        );
        if (!imageBuffer) {
            return res
                .status(400)
                .json({ message: "Error al procesar la imagen" });
        }

        const labels = await imageProccesor.extractText(imageBuffer);

        const tags = extractTags(labels);
        res.json({ labels, tags });
    } catch (err) {
        console.error("Error al analizar la imagen:", err);
        res.status(500).json({
            error: err.message,
            message: "Error en el servidor",
        });
    }
    console.log("POST /analyzeImage");
});

router.post("/playAudio", authenticateJWT, async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ err: "User ID is required" });
    }

    try {
        const query = "SELECT CV FROM USUARIO WHERE ID = ?";
        const [rows] = await db.query(query, [userId]);

        if (rows.length === 0 || !rows[0].CV) {
            return res.status(404).json({ err: "User or CV not found" });
        }

        const cvPath = rows[0].CV;

        const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: cvPath,
        };

        s3.getObject(s3Params, async (err, data) => {
            if (err) {
                console.log("Error fetching CV from S3:", err);
                return res
                    .status(500)
                    .json({ err: "Error fetching CV from S3" });
            }

            const pdfBuffer = data.Body;

            try {
                const pdfData = await pdf(pdfBuffer);
                const text = pdfData.text;

                if (!text) {
                    return res
                        .status(400)
                        .json({ err: "No text found in PDF" });
                }

                const audioData = await textToSpeech(text);

                res.setHeader("Content-Type", "audio/mpeg");
                res.send(audioData.AudioStream);
            } catch (err) {
                console.error(
                    "Error processing PDF or generating speech:",
                    err
                );
                return res
                    .status(500)
                    .json({ err: "Error processing PDF or generating speech" });
            }
        });
    } catch (err) {
        console.error("Error en la ruta /playAudio:", err);
        res.status(500).json({ err: "Internal server error" });
    }
});
router.post("/translateText", async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;
        if (!text || !targetLanguage) {
            return res
                .status(400)
                .json({ message: "Faltan campos obligatorios" });
        }
        const translatedText = await translateText(text, targetLanguage);
        res.json({ translatedText });
    } catch (err) {
        console.error("Error al traducir el texto:", err);
        res.status(500).json({
            error: err.message,
            message: "Error en el servidor",
        });
    }
});
function extractTags(detectedTexts) {
    const keywords = [
        "JavaScript",
        "AWS",
        "React",
        "Python",
        "Node.js",
        "Java",
        "C#",
        "C++",
        "TypeScript",
        "HTML",
        "CSS",
        "SQL",
        "NoSQL",
        "MongoDB",
        "MySQL",
        "PostgreSQL",
        "Docker",
        "Kubernetes",
        "Git",
        "GitHub",
        "Bitbucket",
        "Agile",
        "Scrum",
        "JIRA",
        "CI/CD",
        "Azure",
        "GCP",
        "Linux",
        "Windows",
        "Machine Learning",
        "Data Science",
        "TensorFlow",
        "Keras",
        "PyTorch",
        "Natural Language Processing",
        "Computer Vision",
        "AWS Lambda",
        "S3",
        "EC2",
        "DynamoDB",
        "Express",
        "Flask",
        "Django",
        "Spring",
        "Hibernate",
        "REST API",
        "GraphQL",
        "SOAP",
        "Microservices",
        "Cloud",
        "Blockchain",
        "Cryptography",
        "Data Mining",
        "Big Data",
        "Hadoop",
        "Spark",
        "Kotlin",
        "Swift",
        "Objective-C",
        "Flutter",
        "Android",
        "iOS",
        "Xcode",
        "Visual Studio Code",
        "Eclipse",
        "IntelliJ",
        "TDD",
        "BDD",
        "Unit Testing",
        "Jest",
        "Mocha",
        "Chai",
        "Selenium",
        "Cypress",
        "Automation",
        "DevOps",
        "Terraform",
        "Ansible",
        "Chef",
        "Puppet",
    ];

    const lowerCaseTexts = detectedTexts.map((text) => text.toLowerCase());

    const matchingTags = keywords.filter((keyword) =>
        lowerCaseTexts.some((text) => text.includes(keyword.toLowerCase()))
    );

    const minTags = 5;
    const maxTags = 7;
    const numTags = Math.min(Math.max(matchingTags.length, minTags), maxTags);

    const selectedTags = shuffleArray(matchingTags).slice(0, numTags);

    return selectedTags;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

module.exports = router;
