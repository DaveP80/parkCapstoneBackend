const express = require("express");
const router = express.Router();

const {
  getSpaceByAddr,
  getSpaceByCity,
  getSpaceByZip,
  getSpaceByIsOccupied,
} = require("../controllers/searchController");

const getAllSpaces = require("../controllers/heroController")

router.get("/city/c/:city", getSpaceByCity);

router.get("/address/a/:addr", getSpaceByAddr);

router.get("/zip/z/:zip", getSpaceByZip);

router.get("/is/occupied/:B/o/:city", getSpaceByIsOccupied);

router.get("/", getAllSpaces);

module.exports = router;
