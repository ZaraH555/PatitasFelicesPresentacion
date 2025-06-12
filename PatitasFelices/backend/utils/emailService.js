const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendRecoveryEmail(to, token) {
  const resetUrl = `http://localhost:4200/auth/restablecer/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: 'Recuperación de Contraseña - Patitas Felices',
    html: `
      <h1>Recuperación de Contraseña</h1>
      <p>Has solicitado restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <a href="${resetUrl}">Restablecer Contraseña</a>
      <p>Si no solicitaste este cambio, ignora este correo.</p>
      <p>El enlace expirará en 1 hora.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

module.exports = {
  sendRecoveryEmail
};
