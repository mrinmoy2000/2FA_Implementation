const User = require("../models/User");
const speakEasy = require("speakeasy");
const qrCode = require("qrcode");
const jwt = require("jsonwebtoken");
const asyncManager = require("../utils/asyncManager");
const TwoFactorError = require("../utils/twoFactorError");

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
  user.twoFactorAuthEnabled = undefined;

  res.status(statusCode).cookie("facade", token, cookieOptions).json({
    success: true,
    token,
    data: {
      user,
    },
  });
};

// 2 factor authentication setup
const generateSpeakEasySecretCode = () => {
  const secretCode = speakEasy.generateSecret({
    name: process.env.TWO_FACTOR_APP_NAME,
  });
  return {
    otpauthUrl: secretCode.otpauth_url,
    base32: secretCode.base32,
  };
};

const returnQRCode = (data, res) => {
  qrCode.toFileStream(res, data);
};

exports.generate2FACode = async (req, res, next) => {
  const token = req.cookies.facade;
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const { otpauthUrl, base32 } = generateSpeakEasySecretCode();
  await User.findOneAndUpdate(decoded.id, {
    twoFactorAuthCode: base32,
  });
  returnQRCode(otpauthUrl, res);
};

exports.verify2FACode = async (req, res, next) => {
  const { token } = req.body;
  const cookieToken = req.cookies.facade;
  const decoded = jwt.verify(cookieToken, process.env.JWT_SECRET_KEY);
  const user = await User.findById(decoded.id);

  const verified = speakEasy.totp.verify({
    secret: user.twoFactorAuthCode,
    encoding: "base32",
    token
  })

  if(verified){
    await User.findOneAndUpdate(decoded.id, {
      twoFactorAuthEnabled: true
    })
    cookieTokenResponse(user, 200, res);
  }
  else{
    res.json({
      verified: false
    })
  }
}

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

exports.loginUser = asyncManager(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new TwoFactorError("Please enter both email and password.", 400)
    );
  }

  const user = await User.findOne({ email: email }).select("+password");
  if (!user) {
    return next(
      new TwoFactorError("Please enter valid email and password.", 401)
    );
  }

  const isMatching = await user.comparePasswords(password);

  if (!isMatching) {
    return next(new TwoFactorError("Please enter valid password.", 400));
  }

  if(user.twoFactorAuthEnabled){
    res.send({
      twoFactorAuthEnabled: true
    })
  }
  else{
    cookieTokenResponse(user, 200, res);
  }

  cookieTokenResponse(user, 200, res);
});

exports.logoutUser = asyncManager(async (req, res, next) => {
  res.cookie("facade", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});
