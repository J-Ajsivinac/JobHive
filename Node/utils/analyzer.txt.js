const AWS = require("aws-sdk");
require("dotenv").config();

const rekognition = new AWS.Rekognition({
    accessKeyId: process.env.REKOGNITION_ACCESS_KEY_ID,
    secretAccessKey: process.env.REKOGNITION_SECRET_ACCESS_KEY,
    region: process.env.REKOGNITION_REGION,
});

async function extractText(base64Image) {
    try {
        const buffer = Buffer.from(base64Image, "base64");

        console.log("Enviando imagen a AWS Rekognition...");
        console.log("Tamaño del buffer:", buffer.length, "bytes");

        const response = await rekognition
            .detectText({
                Image: {
                    Bytes: buffer,
                },
            })
            .promise();

        console.log(
            "Respuesta de Rekognition:",
            JSON.stringify(response, null, 2)
        );

        if (!response.TextDetections || response.TextDetections.length === 0) {
            console.log("No se detectó texto en la imagen");
            return [];
        }

        const detectedTexts = response.TextDetections.filter(
            (detection) =>
                detection.Type === "LINE" || detection.Type === "WORD"
        ).map((detection) => detection.DetectedText);

        console.log("Textos detectados:", detectedTexts);
        return detectedTexts;
    } catch (error) {
        console.error("Error detallado en extractText:", error);
        console.error("Código de error:", error.code);
        console.error("Mensaje:", error.message);
        console.error("Stack:", error.stack);
        throw new Error(
            `Error al procesar la imagen con Rekognition: ${error.message}`
        );
    }
}

module.exports = { extractText };
