const nodemailer = require("nodemailer");

async function testSMTP() {
    try {
        console.log('Iniciando prueba de conexión SMTP...');
        
        // Usar exactamente la misma configuración que tu aplicación
        let selfSignedConfig = {
            host: process.env.SMTP_HOST || '10.66.250.230',
            port: process.env.SMTP_PORT || 25,
            debug: true, // Para ver logs detallados
        };
        
        // Si tienes credenciales, úsalas
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            selfSignedConfig['auth'] = {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
            console.log(`Usando autenticación con usuario: ${process.env.SMTP_USER}`);
        } else {
            console.log('No se usará autenticación SMTP');
        }
        
        console.log('Configuración SMTP:', JSON.stringify({
            host: selfSignedConfig.host,
            port: selfSignedConfig.port,
            auth: selfSignedConfig.auth ? { user: selfSignedConfig.auth.user } : null
        }));
        
        // Crear transporte
        let transporter = nodemailer.createTransport(selfSignedConfig);
        
        // Verificar conexión
        console.log('Verificando conexión...');
        await transporter.verify();
        console.log('✓ Conexión SMTP verificada correctamente');
        
        // Enviar correo de prueba
        console.log('Enviando correo de prueba...');
        const info = await transporter.sendMail({
            from: "asistentevirtual@entel.net.pe",
            to: "o&mcore.voz@entel.pe", // Cambia a tu correo para probar
            subject: "Prueba de conexión SMTP",
            text: "Este es un correo de prueba para verificar la conexión SMTP."
        });
        
        console.log('✓ Correo enviado exitosamente:', {
            messageId: info.messageId,
            response: info.response
        });
        
        return true;
    } catch (error) {
        console.error('✗ Error en la prueba SMTP:', error);
        return false;
    }
}

// Ejecutar la prueba
testSMTP();
