require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { sendResetEmail } = require("./sendEmail");
const User = require("./model");

const app = express();
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.DB)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Route to request password reset
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  // Generate token
  const token = crypto.randomBytes(32).toString("hex");
  user.resetToken = token;
  user.tokenExpiry = Date.now() + 3600000; // 1 hour expiry
  await user.save();

  // Send email
  const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await sendResetEmail(user.email, resetLink);
  res.json({ message: "Password reset email sent" });
});

// Route to handle password reset
app.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const user = await User.findOne({
    resetToken: token,
    tokenExpiry: { $gt: Date.now() },
  });
  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });

  // Hash and save new password
  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  user.resetToken = undefined;
  user.tokenExpiry = undefined;
  await user.save();

  res.json({ message: "Password successfully updated" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
