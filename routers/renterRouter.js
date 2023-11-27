const express = require("express");
const router = express.Router();

const {        
  renterAddressUpdate,
  createNewProperty,
  getPropertyInfo,
  createNewSpaces,
  updateSpaceInfo,
  updateBookingStatus,
  getPropAndSpaceInfo,
  getActiveBookings,
  getSoldSpaces,
  getEarningsByOwnerId
} = require("../controllers/renterController");

router.get("/get-yourinfo", getPropertyInfo);

router.get("/get-soldbookings", getSoldSpaces);

router.get("/get-bookingactivity", getActiveBookings);

router.get("/get-property-with-spaceinfo", getPropAndSpaceInfo);

router.get("/get-totalearnings", getEarningsByOwnerId);

router.post("/create-property", createNewProperty);

router.post("/enter-newspaces", createNewSpaces);

router.put("/update-singlespace-info", updateSpaceInfo);

router.put("/update-singlebooking-status", updateBookingStatus);

router.put("/update-address", renterAddressUpdate);


module.exports = router;
