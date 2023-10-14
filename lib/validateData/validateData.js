const {
  isAlphanumeric,
  isEmail,
  isStrongPassword,
  isAlpha,
} = require("validator");

function validateData(req, res, next) {
  const { firstName, lastName, email, password } = req.body;

  let errObj = {};

  if (firstName) {
    if (!isAlpha(firstName)) {
      errObj.firstName = "firstName can only have alphabet";
    }
  }

  if (lastName) {
    if (!isAlpha(lastName)) {
      errObj.lastName = "lastName can only have alphabet";
    }
  }

  if (email) {
    if (!isEmail(email)) {
      errObj.email = "email can only have alphabet";
    }
  }

  if (password) {
    if (!isStrongPassword(password)) {
      errObj.password =
        "Password must contains 1 lowercase, 1 uppcase, 1 number, 1 special character, and at least 8 characters long";
    }
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

module.exports = validateData;
