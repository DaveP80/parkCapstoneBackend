const express = require("express");
const router = express.Router();

const { getSpotDetailsById } = require("../controllers/spotDetailsController");

router.get("/:id", getSpotDetailsById);

module.exports = router;
