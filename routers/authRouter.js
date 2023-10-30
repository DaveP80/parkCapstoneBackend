const express = require("express");
const router = express.Router();

const validateData = require("../lib/validateData/validateData");
const checkEmpty = require("../lib/checkEmpty/checkEmpty");

const {        
  createUserFunc,
  authCreateUser,
  loginFunc,
} = require("../controllers/authController");

const { authUserMiddleware, jwtMiddleware } = require("../lib/authMiddleware/jwtMiddleware");

//router.get("/", jwtMiddleware, allGetUsersFunc);

router.put("/create-user/auth", authUserMiddleware, authCreateUser);

router.post("/create-user", createUserFunc);

router.post("/login", loginFunc);

module.exports = router;
