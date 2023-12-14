// Import necessary modules
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB using Mongoose
mongoose.connect(
  "mongodb+srv://Rafay:VOd7KhdY8doimhih@cluster1.nqnx6dm.mongodb.net/expressAuth?retryWrites=true&w=majority",
//   {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   }
);
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Create a Mongoose model for user and define your required attributes/field in it
const User = mongoose.model("User", {
  username: String,
  password: String,
});

// Secret key for JWT // use it from here. next time get this from env
const secretKey = "qwertyuiop@1234567890!asdfghjkl";

// Middleware to check for a valid JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.sendStatus(401);

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Endpoint to register a new user
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send("User registered successfully");
  } catch (error) {
    res.status(500).send("Error registering user");
  }
});

// Endpoint to generate a JWT token after successful login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(401).send("Invalid username or password");

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res.status(401).send("Invalid username or password");

  const token = jwt.sign({ username: user.username }, secretKey);
  res.json({ token });
});

// Protected endpoint that requires a valid JWT token for access
app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "This is a protected endpoint", user: req.user });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
