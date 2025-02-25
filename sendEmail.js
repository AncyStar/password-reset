const nodemailer = require("nodemailer");

const sendResetEmail = async (to, link) => {
  try {
    // Configure transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your email from .env
        pass: process.env.EMAIL_PASS, // Your app password from .env
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: "Password Reset Link",
      html: `<p>You requested a password reset</p>
             <p>Click this link to reset your password:</p>
             <a href="${link}">${link}</a>`,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully");
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email. Try again later.");
  }
};

module.exports = { sendResetEmail };
