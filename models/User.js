const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add your name."],
  },

  email: {
    type: String,
    required: [true, "Please provide a correct email address."],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email address."],
  },

  password: {
    type: String,
    required: [true, "Please provide a password."],
    minlength: 8,
    select: false,
  },

  confirmPassword: {
    type: String,
    required: [true, "Please confirm your password."],
    validate: {
      validator: function (pass) {
        return pass === this.password;
      },
      message: "Entered passwords do not match.",
    },
  },
});

//Hash the password if modifed
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  this.confirmPassword = undefined;
  next();
});

//Create a JWT web token
UserSchema.methods.signJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//Compare passwords
UserSchema.methods.comparePasswords = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//Export the model
let model;
try {
  model = mongoose.model("User");
} catch (error) {
  model = mongoose.model("User", UserSchema);
}

module.exports = model;
