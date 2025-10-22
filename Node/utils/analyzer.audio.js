const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({ region: process.env.AWS_REGION });
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const polly = new AWS.Polly();

async function textToSpeech(text) {
    const params = {
        Text: text,
        OutputFormat: 'mp3',
        VoiceId: 'Joanna',
    };
    return polly.synthesizeSpeech(params).promise();
}


module.exports = { textToSpeech };
