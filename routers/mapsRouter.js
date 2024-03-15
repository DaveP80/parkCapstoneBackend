const express = require("express");
const router = express.Router();

const {
  verifyAddressFromForm,
  getUserLocation,
} = require("../controllers/mapsController");

router.post("/verify-addr", verifyAddressFromForm);
router.get("/", getUserLocation);

module.exports = router;
