require("dotenv").config();
const express = require("express");
const connectToDB = require("./database/db");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({
    h1: "Welcome to the NodeJs 2FA App",
  });
});

app.listen(PORT, async () => {
  await connectToDB();
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
