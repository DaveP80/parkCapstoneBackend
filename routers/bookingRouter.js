const express = require("express");
const router = express.Router();

const {
  makeNewCheckoutB,
  getBookings
} = require("../controllers/bookingController");

router.get("/mybookings", getBookings);

router.post("/insert-one", makeNewCheckoutB);

module.exports = router;
