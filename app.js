const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require('cookie-parser');
const credentials = require('./lib/authMiddleware/credentials');
const corsOptions = require('./config/corsOptions');

const userRouter = require("./routers/userRouter");
const renterRouter = require("./routers/renterRouter");
const pmtRouter = require("./routers/pmtRouter");
const errorController = require("./controllers/errorController");
const app = express();
app.use(credentials);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/users", userRouter);

app.use("/renters", renterRouter);

app.use("/checkout", pmtRouter);

app.get("/", (req, res) => {
  res.send("Welcome to Park App");
});

app.get("*", (req, res) => {
  res.status(404).send("Page not found!");
});

app.use(errorController);

module.exports = app;
