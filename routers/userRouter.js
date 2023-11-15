const express = require("express");
const router = express.Router();

const {        
  userProfile,
  clientAddressUpdate,
} = require("../controllers/userController");

router.get("/profile", userProfile);

router.get("/profile", userProfile);

router.put("/update-address", clientAddressUpdate);

module.exports = router;
