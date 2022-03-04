const mongoose = require("mongoose");

const connectToDB = async () => {
  const connect = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log(`MongoDB connected to host: ${connect.connection.host}`);
};

module.exports = connectToDB;
