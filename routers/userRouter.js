const express = require("express");
const router = express.Router();

const validateData = require("../lib/validateData/validateData");
const checkEmpty = require("../lib/checkEmpty/checkEmpty");

const {        
  userProfile,
} = require("../controllers/userController");

const { authUserMiddleware, jwtMiddleware } = require("../lib/authMiddleware/jwtMiddleware");

//router.get("/", jwtMiddleware, allGetUsersFunc);

router.get("/profile", userProfile);

module.exports = router;
