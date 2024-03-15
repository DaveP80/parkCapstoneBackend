const axios = require("axios");
require("dotenv").config();
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
const apiKeyII = process.env.GOOGLE_MAPS_API_KEYII;

const getUserLocation = async (req, res) => {
  const latlng = req.query.latlng;
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng}&key=${apiKeyII}`,
    );
    const responseData = response.data;
    res.json(responseData);
  } catch (e) {
    res.json({ message: "error on fetching google maps API", error: e.error });
  }
};

const verifyAddressFromForm = async (req, res, next) => {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: req.body.address,
          key: apiKey,
        },
      },
    );

    if (!response?.data?.results) {
      res.json({ confirm: false, formattedAddress: null });
    } else if (
      response?.data?.results[0]?.address_components?.some((item) =>
        item?.types?.includes("postal_code"),
      )
    ) {
      res.json({
        confirm: true,
        formattedAddress: response?.data?.results[0]?.formatted_address,
      });
    } else res.json({ confirm: false, formattedAddress: null });
  } catch (e) {
    res.json({ message: "error on fetching google maps API", error: e.error });
  }
};
module.exports = {
  verifyAddressFromForm,
  getUserLocation,
};
