const { bySpaceId } = require("../queries/search");
const { stc } = require("../lib/helper/helper");

const getSpotDetailsById = async (req, res) => {
  const spotId = req.params.id;

  try {
    const response = await bySpaceId(spotId);

    if (!response) {
      return res.status(404).json({ error: "Spot details not found" });
    }

    res.json(response);
  } catch (error) {
    res.status(stc(error)).json({ error: error.error, message: error.message });
  }
};

module.exports = {
  getSpotDetailsById,
};
