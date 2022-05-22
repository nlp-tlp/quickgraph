const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
require("dotenv/config");

const { DB_HOST, DB_PORT, DB_NAME } = process.env;

const DB_CONNECTION = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;

// Middleware
app.use(cors());
app.use(express.urlencoded({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// Authentication
app.use("/api/auth", require("./routes/auth/auth"));

// User management
app.use("/api/user", [
  require("./routes/user/management"),
  require("./routes/user/profile"),
  require("./routes/user/collaboration"),
]);

// Project
app.use("/api/project", [
  require("./routes/project/project"),
  require("./routes/project/create"),
  require("./routes/project/download"),
  require("./routes/project/graph"),
  require("./routes/project/dashboard"),
  require("./routes/project/cluster"),
]);

// Text/Annotation
app.use("/api/text", require("./routes/text/text"));

// Connect to mongo db
mongoose.connect(DB_CONNECTION, { useNewUrlParser: true }, () => {
  console.log("Connected to db!");
});

// Create listener
const port = 3010;
app.listen(port, () => console.log(`Server started on port ${port}`));
