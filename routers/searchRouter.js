const express = require("express");
const router = express.Router();

const {
  getSpaceByZA,
  getSpaceByAddrB,
  getSpaceByLatLng,
  getSpaceByZip,
  getSpaceByIsOccupied,
} = require("../controllers/searchController");

const getAllSpaces = require("../controllers/heroController");
const { getSpacesByTimeAndPropertyId, getAvailSpaces, getAvailSpacesGeo } = require("../controllers/bookingController");

router.get("/address/a", getSpaceByZA);

router.get("/geolocation", getSpaceByLatLng);

router.get("/checkout/a", getSpacesByTimeAndPropertyId);

router.get("/landing", getAvailSpaces);

router.get("/location-and-time", getAvailSpacesGeo);

router.post("/zip/z", getSpaceByZip);

router.post("/is/occupied/:B/o", getSpaceByIsOccupied);

router.get("/", getAllSpaces);

module.exports = router;
