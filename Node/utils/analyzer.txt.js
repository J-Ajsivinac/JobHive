const AWS = require('aws-sdk');
require('dotenv').config();

const rekognition = new AWS.Rekognition({
    accessKeyId: process.env.REKOGNITION_ACCESS_KEY_ID,
    secretAccessKey: process.env.REKOGNITION_SECRET_ACCESS_KEY,
    region: process.env.REKOGNITION_REGION,
});

async function extractText(base64Image) {
    try {
        const buffer = Buffer.from(base64Image, 'base64');
        const response = await rekognition.detectText({
            Image: {
                Bytes: buffer
            }
        }).promise();
        console.log(response);
        return response.TextDetections.map(detection => detection.DetectedText);
    } catch (error) {
        console.error(error);
        throw new Error('Ocurrió un error al procesar la imagen.');
    }
}


module.exports = {extractText};