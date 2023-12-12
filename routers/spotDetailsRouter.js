const express = require("express");
const router = express.Router();

const { getSpotDetailsById } = require("../controllers/spotDetailsController");

router.get("/spot-details/:id", getSpotDetailsById);

module.exports = router;
