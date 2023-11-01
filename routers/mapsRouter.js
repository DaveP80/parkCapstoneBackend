const express = require("express");
const router = express.Router();

const {
  verifyAddressFromForm,
} = require("../controllers/mapsController");

router.post("/verify-addr", verifyAddressFromForm);

module.exports = router;
