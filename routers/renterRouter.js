const express = require("express");
const router = express.Router();

const {        
  loginFunc,
  renterAddressUpdate,
} = require("../controllers/renterController");

router.put("/update-address", renterAddressUpdate);

module.exports = router;
