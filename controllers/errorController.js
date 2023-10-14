function sendMessageBack(error, req, res) {
  res.status(error.status).json({ message: error.error, status: "failure" });
}

function errorController(error, req, res, next) {
  if (error.status === 409) {
    sendMessageBack(error, req, res);
  }

  if (process.env.NODE_DEV === "development") {
    //this is where you show all the errors
  }

  if (process.env.NODE_DEV === "production") {
    //this is where you don't show all the errors to users
    //sorry something went wrong, please contact support
  }
}

module.exports = errorController;
