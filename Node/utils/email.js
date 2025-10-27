const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurar transporter SMTP
const transporter = nodemailer.createTransport({
    host: 'email-smtp.us-east-1.amazonaws.com', // SES SMTP endpoint
    port: 587, // Puerto TLS
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.SES_SMTP_USERNAME,
        pass: process.env.SES_SMTP_PASSWORD,
    },
});

/**
 * Envía un correo electrónico usando SMTP
 * 
 * @param {Object} options - Opciones del correo
 * @param {string} options.to - Correo del destinatario
 * @param {string} options.subject - Asunto del correo
 * @param {string} options.htmlBody - Cuerpo del correo en HTML
 * @param {string} [options.textBody] - Cuerpo del correo en texto plano (opcional)
 * @param {string} [options.from] - Correo del remitente (opcional, usa SES_FROM_EMAIL por defecto)
 * @returns {Promise} - Resultado del envío
 * 
 * @example
 * await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Bienvenido a JobHive',
 *   htmlBody: '<h1>Hola!</h1><p>Gracias por registrarte.</p>',
 *   textBody: 'Hola! Gracias por registrarte.'
 * });
 */
async function sendEmail({ to, subject, htmlBody, textBody, from }) {
    const fromEmail = from || process.env.SES_FROM_EMAIL;

    if (!fromEmail) {
        throw new Error('SES_FROM_EMAIL no está configurado en las variables de entorno');
    }

    const mailOptions = {
        from: fromEmail,
        to: to,
        subject: subject,
        html: htmlBody,
        text: textBody || '',
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log('Email enviado exitosamente:', result.messageId);
        return result;
    } catch (error) {
        console.error('Error al enviar email:', error);
        throw error;
    }
}

/**
 * Envía un correo de notificación de postulación a un trabajo
 * 
 * @param {Object} options
 * @param {string} options.userEmail - Email del usuario que se postuló
 * @param {string} options.userName - Nombre del usuario
 * @param {string} options.jobTitle - Título del trabajo
 * @param {string} options.jobId - ID del trabajo
 * @returns {Promise}
 */
async function sendJobApplicationNotification({ userEmail, userName, jobTitle, jobId }) {
    const subject = `Postulación exitosa - ${jobTitle}`;
    
    const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #5243F5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
                .button { display: inline-block; padding: 10px 20px; background-color: #5243F5; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>¡Postulación Exitosa!</h1>
                </div>
                <div class="content">
                    <p>Hola <strong>${userName}</strong>,</p>
                    <p>Tu postulación al puesto de <strong>${jobTitle}</strong> ha sido recibida exitosamente.</p>
                    <p>Nuestro equipo revisará tu perfil y te contactaremos pronto con una respuesta.</p>
                    <p>ID de la postulación: <code>${jobId}</code></p>
                    <p>¡Mucha suerte!</p>
                </div>
                <div class="footer">
                    <p>Este es un correo automático de JobHive. Por favor no responder.</p>
                    <p>&copy; 2025 JobHive - Hire Vision Project</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textBody = `
Hola ${userName},

Tu postulación al puesto de ${jobTitle} ha sido recibida exitosamente.

Nuestro equipo revisará tu perfil y te contactaremos pronto con una respuesta.

ID de la postulación: ${jobId}

¡Mucha suerte!

---
Este es un correo automático de JobHive. Por favor no responder.
© 2025 JobHive - Hire Vision Project
    `;

    return sendEmail({
        to: userEmail,
        subject,
        htmlBody,
        textBody,
    });
}

/**
 * Envía un correo de cambio de estado de postulación
 * 
 * @param {Object} options
 * @param {string} options.userEmail - Email del usuario
 * @param {string} options.userName - Nombre del usuario
 * @param {string} options.jobTitle - Título del trabajo
 * @param {string} options.status - Estado: 'Aceptado', 'Rechazado', 'En revisión'
 * @returns {Promise}
 */
async function sendJobStatusNotification({ userEmail, userName, jobTitle, status }) {
    const statusMessages = {
        'Aceptado': {
            subject: `¡Felicidades! Fuiste aceptado - ${jobTitle}`,
            message: '¡Tenemos excelentes noticias! Tu postulación ha sido aceptada. Pronto nos pondremos en contacto contigo para coordinar los siguientes pasos.',
            color: '#4CAF50',
        },
        'Rechazado': {
            subject: `Actualización de postulación - ${jobTitle}`,
            message: 'Lamentablemente, en esta ocasión decidimos continuar con otros candidatos. Te agradecemos tu interés y te invitamos a postularte a otras oportunidades.',
            color: '#F44336',
        },
        'En revisión': {
            subject: `Tu postulación está en revisión - ${jobTitle}`,
            message: 'Tu postulación está siendo revisada por nuestro equipo. Te notificaremos cualquier actualización.',
            color: '#FF9800',
        },
    };

    const statusInfo = statusMessages[status] || statusMessages['En revisión'];

    const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: ${statusInfo.color}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
                .status-badge { display: inline-block; padding: 5px 15px; background-color: ${statusInfo.color}; color: white; border-radius: 20px; font-weight: bold; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Actualización de Postulación</h1>
                </div>
                <div class="content">
                    <p>Hola <strong>${userName}</strong>,</p>
                    <p>El estado de tu postulación para <strong>${jobTitle}</strong> ha cambiado a:</p>
                    <p style="text-align: center;">
                        <span class="status-badge">${status}</span>
                    </p>
                    <p>${statusInfo.message}</p>
                </div>
                <div class="footer">
                    <p>Este es un correo automático de JobHive. Por favor no responder.</p>
                    <p>&copy; 2025 JobHive - Hire Vision Project</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textBody = `
Hola ${userName},

El estado de tu postulación para ${jobTitle} ha cambiado a: ${status}

${statusInfo.message}

---
Este es un correo automático de JobHive. Por favor no responder.
© 2025 JobHive - Hire Vision Project
    `;

    return sendEmail({
        to: userEmail,
        subject: statusInfo.subject,
        htmlBody,
        textBody,
    });
}

module.exports = {
    sendEmail,
    sendJobApplicationNotification,
    sendJobStatusNotification,
};
