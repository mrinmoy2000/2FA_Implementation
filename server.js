require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser")
const connectToDB = require("./database/db");
const ErrorsMiddleWare = require("./middleware/mongoErrorHandler")

process.on("uncaughtException", () => {
  console.log("Stopping server due to UnCaught Exception");
  console.log(`Error: ${error}`);
  process.exit(1);
});

const app = express();

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({
    h1: "Welcome to the NodeJs 2FA App",
  });
});

//Routes
const authRoutes = require("./route/authRoutes")

app.use("/api/v1/", authRoutes)

//Errors MiddleWare
app.use(ErrorsMiddleWare);

const server = app.listen(PORT, async () => {
  await connectToDB();
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on("unhandledRejection", (error) => {
  console.log("Shutting down server due to Unhandled Rejection error");
  console.log(`Error: ${error.stack}`);

  server.close(() => {
    process.exit(1);
  });
});
