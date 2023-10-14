const express = require("express");
const router = express.Router();

const validateData = require("../lib/validateData/validateData");
const checkEmpty = require("../lib/checkEmpty/checkEmpty");

const {        
  allGetUsersFunc,
  createUserFunc,
  authCreateUser,
  loginFunc,
} = require("../controllers/userController");

const { authUserMiddleware, jwtMiddleware } = require("../lib/authMiddleware/jwtMiddleware");

router.get("/", jwtMiddleware, allGetUsersFunc);

router.get("/create-user/auth", authUserMiddleware, authCreateUser);

//router.post("/create-user", checkEmpty, validateData, createUserFunc);
router.post("/create-user", createUserFunc);

router.post("/login", loginFunc);

module.exports = router;
