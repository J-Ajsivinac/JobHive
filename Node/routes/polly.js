const express = require("express");
const router = express.Router();
const { synthesizeToBase64 } = require("../utils/polly");

/**
 * POST /polly/synthesize
 *
 * Body esperado:
 * {
 *   "text": "Texto a convertir a voz",
 *   "voiceId": "Enrique" (opcional)
 * }
 */
router.post("/synthesize", async (req, res) => {
    try {
        const { text, voiceId } = req.body;

        // Validar que se envió el texto
        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'El campo "text" es requerido',
            });
        }

        // Llamar a la función de síntesis
        const result = await synthesizeToBase64(text, voiceId);

        res.json(result);
    } catch (error) {
        console.error("Error en endpoint /synthesize:", error);
        res.status(500).json({
            success: false,
            error: "Error al sintetizar voz",
            details: error.message,
        });
    }
});

module.exports = router;
