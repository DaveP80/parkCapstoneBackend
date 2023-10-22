const express = require("express");
const router = express.Router();

const {        
  loginFunc,
} = require("../controllers/authController");

router.get("/profile", loginFunc);

module.exports = router;
