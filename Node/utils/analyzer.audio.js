const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({ region: process.env.AWS_REGION });

const polly = new AWS.Polly({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function textToSpeech(text) {
    const params = {
        Text: text,
        OutputFormat: 'mp3',
        VoiceId: 'Joanna', // Voz en inglés, puedes usar 'Miguel' para español
    };
    return polly.synthesizeSpeech(params).promise();
}

module.exports = textToSpeech;
