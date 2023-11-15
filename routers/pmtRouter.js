const express = require("express");
const router = express.Router();

const {        
  confirmUserPmt,
  insertTransaction,
  getClientTransactions
} = require("../controllers/pmtController");

router.post("/create-payment-intent", confirmUserPmt);

router.post("/new-clientpmt", insertTransaction);

router.get("/payment-activity", getClientTransactions);

module.exports = router;
