require("dotenv").config();
const express = require("express");
const connectToDB = require("./database/db");

process.on("uncaughtException", () => {
  console.log("Stopping server due to UnCaught Exception");
  console.log(`Error: ${error}`);
  process.exit(1);
});

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({
    h1: "Welcome to the NodeJs 2FA App",
  });
});

const server = app.listen(PORT, async () => {
  await connectToDB();
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on("unhandledRejection", (error) => {
  console.log("Shutting down server due to Unhandled Reection error");
  console.log(`Error: ${error}`);

  server.close(() => {
    process.exit(1);
  });
});
