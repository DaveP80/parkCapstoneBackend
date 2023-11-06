const express = require("express");
const router = express.Router();

const {
  getSpaceByZA,
  getSpaceByAddrB,
  getSpaceByCity,
  getSpaceByZip,
  getSpaceByIsOccupied,
} = require("../controllers/searchController");

const getAllSpaces = require("../controllers/heroController")

router.post("/city/c", getSpaceByCity);

router.post("/address/a", getSpaceByZA);

router.post("/address/b", getSpaceByAddrB);

router.post("/zip/z", getSpaceByZip);

router.post("/is/occupied/:B/o", getSpaceByIsOccupied);

router.get("/", getAllSpaces);

module.exports = router;
