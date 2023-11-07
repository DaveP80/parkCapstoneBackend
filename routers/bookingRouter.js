const express = require("express");
const router = express.Router();

const {
  getAvailSpaces,
} = require("../controllers/bookingController");

router.get("/search", getAvailSpaces);

module.exports = router;
