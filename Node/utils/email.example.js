/**
 * EJEMPLOS DE USO DEL SERVICIO DE EMAIL
 * 
 * Este archivo muestra cómo usar las funciones de email.js
 * NO ejecutar este archivo directamente - son solo ejemplos
 */

const { 
    sendEmail, 
    sendJobApplicationNotification, 
    sendJobStatusNotification 
} = require('./email');

// ============================================
// EJEMPLO 1: Enviar un correo simple
// ============================================
async function ejemploEmailSimple() {
    try {
        await sendEmail({
            to: 'usuario@example.com',
            subject: 'Bienvenido a JobHive',
            htmlBody: `
                <h1>¡Bienvenido!</h1>
                <p>Gracias por registrarte en JobHive.</p>
                <p>Estamos emocionados de tenerte con nosotros.</p>
            `,
            textBody: 'Bienvenido! Gracias por registrarte en JobHive.',
        });
        console.log('Email enviado exitosamente');
    } catch (error) {
        console.error('Error:', error);
    }
}

// ============================================
// EJEMPLO 2: Notificación de postulación
// ============================================
async function ejemploNotificacionPostulacion() {
    try {
        await sendJobApplicationNotification({
            userEmail: 'candidato@example.com',
            userName: 'Juan Pérez',
            jobTitle: 'Desarrollador Full Stack',
            jobId: '12345',
        });
        console.log('Notificación de postulación enviada');
    } catch (error) {
        console.error('Error:', error);
    }
}

// ============================================
// EJEMPLO 3: Notificación de cambio de estado
// ============================================
async function ejemploNotificacionEstado() {
    try {
        // Para postulación aceptada
        await sendJobStatusNotification({
            userEmail: 'candidato@example.com',
            userName: 'Juan Pérez',
            jobTitle: 'Desarrollador Full Stack',
            status: 'Aceptado', // Opciones: 'Aceptado', 'Rechazado', 'En revisión'
        });
        console.log('Notificación de estado enviada');
    } catch (error) {
        console.error('Error:', error);
    }
}

// ============================================
// EJEMPLO 4: Usar en una ruta de Express
// ============================================
/*
// En routes/jobs.js

const { sendJobApplicationNotification } = require('../utils/email');

router.post('/apply', authenticateJWT, async (req, res) => {
    const { userId, jobId } = req.body;
    
    try {
        // Insertar postulación en la BD
        await db.query('INSERT INTO POSTULACION (...) VALUES (...)', [...]);
        
        // Obtener datos del usuario y trabajo
        const [user] = await db.query('SELECT * FROM USUARIO WHERE ID = ?', [userId]);
        const [job] = await db.query('SELECT * FROM EMPLEO WHERE ID = ?', [jobId]);
        
        // Enviar email de notificación
        await sendJobApplicationNotification({
            userEmail: user[0].CORREO,
            userName: `${user[0].NOMBRE} ${user[0].APELLIDO}`,
            jobTitle: job[0].PUESTO,
            jobId: jobId,
        });
        
        res.json({ message: 'Applied successfully and email sent!' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ err: err.message });
    }
});
*/

// ============================================
// EJEMPLO 5: Enviar correo con adjuntos (avanzado)
// ============================================
/*
// Para enviar adjuntos, necesitarías usar sendRawEmail de SES
// o integrar con Nodemailer + SES Transport

const nodemailer = require('nodemailer');
const aws = require('aws-sdk');

const transporter = nodemailer.createTransport({
    SES: new aws.SES({
        apiVersion: '2010-12-01',
        region: process.env.SES_REGION,
    }),
});

async function enviarConAdjunto() {
    await transporter.sendMail({
        from: process.env.SES_FROM_EMAIL,
        to: 'usuario@example.com',
        subject: 'CV Recibido',
        html: '<p>Gracias por tu postulación</p>',
        attachments: [
            {
                filename: 'cv.pdf',
                path: '/ruta/al/archivo.pdf',
            },
        ],
    });
}
*/

module.exports = {
    ejemploEmailSimple,
    ejemploNotificacionPostulacion,
    ejemploNotificacionEstado,
};
