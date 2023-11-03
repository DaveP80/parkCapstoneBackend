const axios = require("axios");
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

const verifyAddressFromForm = async (req, res, next) => {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: req.body.address,
          key: apiKey,
        },
      }
    );

    if (!response?.data?.results) {
      res.json({ confirm: false, formattedAddress: null });
    }

    else if (response?.data?.results[0]?.address_components?.some(item => item?.types?.includes("postal_code"))) {
      res.json({ confirm: true, formattedAddress: response?.data?.results[0]?.formatted_address})
    }

   else res.json({ confirm: false, formattedAddress: null });
  } catch (e) {
    res.json({ message: "error on fetching google maps API", error: e.error });
  }
};
module.exports = {
  verifyAddressFromForm,
};
