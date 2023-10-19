const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require('cookie-parser');
const credentials = require('./lib/authMiddleware/credentials');
const corsOptions = require('./config/corsOptions');
const authRouter = require("./routers/authRouter");
const userRouter = require("./routers/userRouter");
const renterRouter = require("./routers/renterRouter");
const pmtRouter = require("./routers/pmtRouter");
const verifyJWT = require("./lib/authMiddleware/verifyJWT")
const refreshTokenController = require("./controllers/refreshTokenController");
const logoutController = require("./controllers/logoutController");
const app = express();
app.use(credentials);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/refresh", refreshTokenController);

app.use("/logout", logoutController);

app.use("/auth", authRouter);

app.use(verifyJWT);

app.use("/user", userRouter);

app.use("/renters", renterRouter);

app.use("/checkout", pmtRouter);

app.get("/", (req, res) => {
  res.send("Welcome to Park App");
});

app.get("*", (req, res) => {
  res.status(404).send("Page not found!");
});

module.exports = app;
