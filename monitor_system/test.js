require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuración del transporte
let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // false for port 25, true for port 465
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    } : undefined
});

// Configuración del correo electrónico
let mailOptions = {
    from: '"Example Team" <your_email@example.com>', // dirección del remitente
    to: 'recipient@example.com', // lista de destinatarios
    subject: 'Hello ✔', // línea de asunto
    text: 'Hello world?', // cuerpo del texto plano
    html: '<b>Hello world?</b>' // cuerpo del HTML
};

// Enviar correo electrónico
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log('Error:', error);
    }
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
});

