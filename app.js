const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const userRouter = require("./routers/userRouter");
const errorController = require("./controllers/errorController");
const app = express();

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/users", userRouter);

app.get("/", (req, res) => {
  res.send("Welcome to Park App");
});

app.get("*", (req, res) => {
  res.status(404).send("Page not found!");
});

app.use(errorController);

module.exports = app;
