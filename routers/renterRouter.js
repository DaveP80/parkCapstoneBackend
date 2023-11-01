const express = require("express");
const router = express.Router();

const {        
  renterAddressUpdate,
  createNewProperty,
  getPropertyInfo,
} = require("../controllers/renterController");

router.get("/get-yourinfo", getPropertyInfo);

router.post("/create-property", createNewProperty);

router.put("/update-address", renterAddressUpdate);


module.exports = router;
