const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const pdf = require('pdf-parse');
const translateText = require('../utils/translate.text');
const imageProccesor = require('../utils/analyzer.txt');
const textToSpeech = require('../utils/analyzer.audio');
const jwksClient = require('jwks-rsa');

const db = require('../utils/db');

require('dotenv').config();

AWS.config.update({ region: process.env.AWS_REGION });
const cognito = new AWS.CognitoIdentityServiceProvider();
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const client = jwksClient({
    jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_USER_POOL_ID}/.well-known/jwks.json`,
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ err: 'Authorization header not found' });
    }

    const token = authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, getKey, {}, (err, user) => {
            if (err) {
                return res.status(403).json({ err: 'Invalid token' });
            }

            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ err: 'Token not found' });
    }
};

router.post('/signup', async (req, res) => {
    const { first_name, last_name, email, birth_date, password, picture } = req.body;

    if (!first_name || !last_name || !email || !birth_date || !password || !picture) {
        return res.status(400).json({ err: 'Missing required fields' });
    }

    try {
        let params = {
            ClientId: process.env.AWS_CLIENT_ID,
            Password: password,
            Username: email,
        };

        const data = await cognito.signUp(params).promise();

        const picBuffer = Buffer.from(picture.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `imagenes/${email}-${Date.now()}.jpg`,
            Body: picBuffer,
            ContentType: 'image/jpeg',
        };

        const s3Data = await s3.upload(params).promise();
        const pictureUrl = s3Data.Location;

        const query = 'INSERT INTO USUARIO (NOMBRE, APELLIDO, CORREO, FECHA_NACIMIENTO, FOTO) VALUES (?, ?, ?, ?, ?)';
        await db.query(query, [first_name, last_name, email, birth_date, pictureUrl]);
        res.json(data);
    } catch (err) {
        console.log(err);
        res.status(400).json({ err: err.message });
    }
});

router.post('/confirm', (req, res) => {
    const { email, code } = req.body;

    const params = {
        ClientId: process.env.AWS_CLIENT_ID,
        ConfirmationCode: code,
        Username: email,
    };

    cognito.confirmSignUp(params, (err, data) => {
        if (err) {
            console.log(err);
            if (err.code === 'LimitExceededException') {
                return res.status(429).json({ err: 'Too many attempts. Please try again later.' });
            }
            return res.status(400).json({ err: err.message });
        } else {
            res.json(data);
        }
    });
});

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: process.env.AWS_CLIENT_ID,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
        },
    };

    try {
        const data = await cognito.initiateAuth(params).promise();
        const idToken = data.AuthenticationResult.IdToken;
        const accessToken = data.AuthenticationResult.AccessToken;
        const [row] = await db.query('SELECT * FROM USUARIO WHERE CORREO = ?', [email]);
        if (row.length === 0) {
            throw new Error('User not found in database');
        }
        const user = {
            first_name: row[0].NOMBRE,
            last_name: row[0].APELLIDO,
            email: row[0].CORREO,
            birth_date: row[0].FECHA_NACIMIENTO,
            picture: row[0].FOTO,
            admin: row[0].ADMIN,
        }
        res.json({ idToken, accessToken, user });
    } catch (err) {
        console.log(err);
        res.status(400).json({ err: err.message });
    }
});

router.get('/user', authenticateJWT, (req, res) => {
    res.json({ message: 'Welcome to the protected route!' });
});

router.post('/signout', authenticateJWT, (req, res) => {
    const token = req.body.accessToken;

    const params = {
        AccessToken: token,
    };

    cognito.globalSignOut(params, (err, data) => {
        if (err) {
            console.log(err);
            res.status(400).json({ err: err.message });
        } else {
            res.json({ message: 'Successfully signed out!' });
        }
    });
});

router.post('/upload-cv', authenticateJWT, async (req, res) => {
    const { email, cv } = req.body;

    const cvBuffer = Buffer.from(cv.replace(/^data:application\/\w+;base64,/, ''), 'base64');
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `cv/${email}-${Date.now()}.pdf`,
        Body: cvBuffer,
        ContentType: 'application/pdf',
    };

    try {
        const data = await s3.upload(params).promise();
        const cvUrl = data.Location;

        const query = 'UPDATE USUARIO SET CV = ? WHERE CORREO = ?';
        await db.query(query, [cvUrl, email]);

        res.json(data);
    } catch (err) {
        console.log(err);
        res.status(400).json({ err: err.message });
    }
});

router.post('/analyzeText', authenticateJWT, async (req, res) => {
    try {
        const { imagen } = req.body;
        if (!imagen) {
            return res.status(400).json({ message: 'Imagen no proporcionada' });
        }

        const imageBuffer = Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        if (!imageBuffer) {
            return res.status(400).json({ message: 'Error al procesar la imagen' });
        }

        const labels = await imageProccesor.extractText(imageBuffer);

        const tags = extractTags(labels);
        res.json({ labels, tags });
    } catch (err) {
        console.error('Error al analizar la imagen:', err);
        res.status(500).json({ error: err.message, message: 'Error en el servidor' });
    }
    console.log('POST /analyzeImage');
});

router.post('/playAudio', authenticateJWT, async (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ err: 'User ID is required' });
    }

    try {
        const query = 'SELECT CV FROM USUARIO WHERE ID = ?';
        const [rows] = await db.query(query, [userId]);

        if (rows.length === 0 || !rows[0].CV) {
            return res.status(404).json({ err: 'User or CV not found' });
        }

        const cvPath = rows[0].CV;

        const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: cvPath,
        };

        s3.getObject(s3Params, async (err, data) => {
            if (err) {
                console.log('Error fetching CV from S3:', err);
                return res.status(500).json({ err: 'Error fetching CV from S3' });
            }

            const pdfBuffer = data.Body;

            try {

                const pdfData = await pdf(pdfBuffer);
                const text = pdfData.text;

                if (!text) {
                    return res.status(400).json({ err: 'No text found in PDF' });
                }

                const audioData = await textToSpeech(text);

                res.setHeader('Content-Type', 'audio/mpeg');
                res.send(audioData.AudioStream);
            } catch (err) {
                console.error('Error processing PDF or generating speech:', err);
                return res.status(500).json({ err: 'Error processing PDF or generating speech' });
            }
        });
    } catch (err) {
        console.error('Error en la ruta /playAudio:', err);
        res.status(500).json({ err: 'Internal server error' });
    }
});
router.post('/translateText', async (req, res) => {
    try{
        const { text, targetLanguage } = req.body;
        if (!text || !targetLanguage) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }
        const translatedText = await translateText(text, targetLanguage);
        res.json({ translatedText });
    }catch(err){
        console.error('Error al traducir el texto:', err);
        res.status(500).json({ error: err.message, message: 'Error en el servidor' });
    }
});
function extractTags(detectedTexts) {
    const keywords = [
        'JavaScript', 'AWS', 'React', 'Python', 'Node.js', 'Java', 'C#', 'C++', 'TypeScript',
        'HTML', 'CSS', 'SQL', 'NoSQL', 'MongoDB', 'MySQL', 'PostgreSQL', 'Docker', 'Kubernetes',
        'Git', 'GitHub', 'Bitbucket', 'Agile', 'Scrum', 'JIRA', 'CI/CD', 'Azure', 'GCP', 'Linux',
        'Windows', 'Machine Learning', 'Data Science', 'TensorFlow', 'Keras', 'PyTorch', 
        'Natural Language Processing', 'Computer Vision', 'AWS Lambda', 'S3', 'EC2', 'DynamoDB', 
        'Express', 'Flask', 'Django', 'Spring', 'Hibernate', 'REST API', 'GraphQL', 'SOAP', 
        'Microservices', 'Cloud', 'Blockchain', 'Cryptography', 'Data Mining', 'Big Data', 'Hadoop',
        'Spark', 'Kotlin', 'Swift', 'Objective-C', 'Flutter', 'Android', 'iOS', 'Xcode', 
        'Visual Studio Code', 'Eclipse', 'IntelliJ', 'TDD', 'BDD', 'Unit Testing', 'Jest', 'Mocha',
        'Chai', 'Selenium', 'Cypress', 'Automation', 'DevOps', 'Terraform', 'Ansible', 'Chef', 'Puppet'
    ];

    const lowerCaseTexts = detectedTexts.map(text => text.toLowerCase());

    const matchingTags = keywords.filter(keyword => 
        lowerCaseTexts.some(text => text.includes(keyword.toLowerCase()))
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