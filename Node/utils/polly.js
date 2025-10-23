const AWS = require("aws-sdk");


const polly = new AWS.Polly({
    accessKeyId: process.env.POLLY_ACCESS_KEY_ID,
    secretAccessKey: process.env.POLLY_SECRET_ACCESS_KEY,
    region: process.env.POLLY_REGION || "us-east-1",
});

const synthesizeToBase64 = async (text, voiceId = "Enrique") => {
    try {
        if (!text || text.trim().length === 0) {
            throw new Error("El texto no puede estar vacío");
        }

        const params = {
            OutputFormat: "mp3",
            Text: text,
            VoiceId: voiceId,
        };

        const data = await polly.synthesizeSpeech(params).promise();

        const audioBase64 = data.AudioStream.toString("base64");

        return {
            success: true,
            audioFormat: "mp3",
            contentLength: data.AudioStream.length,
            audioData: audioBase64,
            metadata: {
                voiceId: params.VoiceId,
                textLength: params.Text.length,
                timestamp: new Date().toISOString(),
            },
        };
    } catch (error) {
        console.error("Error en Polly synthesizeToBase64:", error);
        throw error;
    }
};

module.exports = {
    synthesizeToBase64,
};
