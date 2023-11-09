const express = require("express");
const router = express.Router();

const {
  getSpaceByZA,
  getSpaceByAddrB,
  getSpaceByZip,
  getSpaceByIsOccupied,
} = require("../controllers/searchController");

const getAllSpaces = require("../controllers/heroController")

router.get("/address/a", getSpaceByZA);

router.post("/address/b", getSpaceByAddrB);

router.post("/zip/z", getSpaceByZip);

router.post("/is/occupied/:B/o", getSpaceByIsOccupied);

router.get("/", getAllSpaces);

module.exports = router;
