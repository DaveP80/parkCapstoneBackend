const express = require("express");
const router = express.Router();

const {        
  loginFunc,
  renterAddressUpdate,
} = require("../controllers/renterController");

router.get("/update-address", renterAddressUpdate);

module.exports = router;
