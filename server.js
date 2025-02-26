require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendResetEmail } = require("./sendEmail");
const User = require("./model");
const cors = require("cors");
const app = express();

app.use(express.json());

app.use(
  cors({
    origin: [process.env.CLIENT_URL, "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// MongoDB Connection
mongoose
  .connect(process.env.DB)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const JWT_SECRET = process.env.SECRET_KEY;

// Signup Route

app.post("/signup", async (req, res) => {
  console.log("Received signup request:", req.body); // Log request body

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    console.log("Missing fields:", { name, email, password });
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();
    console.log("User registered successfully:", email);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    res
      .status(500)
      .json({ message: "Error signing up user", error: error.message });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in user" });
  }
});

// Forgot Password Route
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  // Generate token
  const token = crypto.randomBytes(32).toString("hex");

  // Update token and expiry directly in the database
  await User.updateOne(
    { email },
    {
      $set: {
        resetToken: token,
        resetTokenExpiry: Date.now() + 3600000, // 1 hour expiry
      },
    }
  );

  // Send email
  const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;
  try {
    await sendResetEmail(user.email, resetLink);
    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send email. Try again later." });
  }
});

// Reset Password Route
app.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  console.log("Received token:", req.params.token);
  console.log("Received newPassword:", req.params.newPassword);

  if (!newPassword || newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long" });
  }

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
  if (user.resetTokenExpiry && user.resetTokenExpiry < Date.now()) {
    return res.status(400).json({ message: "Token expired" });
  }
  user.password = bcrypt.hashSync(newPassword, 10);
  user.resetToken = null;
  user.resetTokenExpiry = null;

  await user.save();

  res.json({ message: "Password successfully reset!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
