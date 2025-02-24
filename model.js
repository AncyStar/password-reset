const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetToken: { type: String },
  tokenExpiry: { type: Date },
});

module.exports = model("User", userSchema);
