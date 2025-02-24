const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendResetEmail(to, link) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Password Reset Request",
    html: `<p>You requested a password reset</p><p>Click this <a href="${link}">link</a> to reset your password.</p>`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendResetEmail };
