const express = require("express");
const router = express.Router();

const {        
  confirmUserPmt,
} = require("../controllers/pmtController");

router.post("/create-payment-intent", confirmUserPmt);

module.exports = router;
