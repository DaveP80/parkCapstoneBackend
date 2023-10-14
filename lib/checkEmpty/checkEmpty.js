function checkEmpty(req, res, next) {
  const { firstName, lastName, email, password, } = req.body;

  let errObj = {};

  if (!firstName) {
    errObj.firstName = "firstName cannot be empty";
  }

  if (!lastName) {
    errObj.lastName = "lastName cannot be empty";
  }

  if (!email) {
    errObj.email = "email cannot be empty";
  }

  if (!password) {
    errObj.password = "Password cannot be empty";
  }

  if (Object.keys(errObj).length > 0) {
    return res.status(500).json({
      message: "error",
      error: errObj,
    });
  } else {
    next();
  }
}

module.exports = checkEmpty;
