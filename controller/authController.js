const User = require("../models/User");
const asyncManager = require("../utils/asyncManager");

const cookieTokenResponse = (user, statusCode, res) => {
  const token = user.signJwtToken();

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  user.password = undefined;

  res.status(statusCode).cookie("facade", token, cookieOptions).json({
    success: true,
    token,
    data: {
      user,
    },
  });
};

exports.registerUser = asyncManager(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    confirmPassword,
  });

  cookieTokenResponse(newUser, 200, res);
});
