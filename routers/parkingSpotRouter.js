const express = require("express");
const router = express.Router();

const {
  getSpotById
} = require("../controllers/parkspotController");

router.get("/:id", getSpotById);

module.exports = router;
