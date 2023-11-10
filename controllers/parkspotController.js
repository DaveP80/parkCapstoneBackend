const { bySpaceId } = require("../queries/search");

const { stc } = require("../lib/helper/helper");
//lookup info by parking space_id
const getSpotById = async (req, res) => {
  const sid = req.params.id;
  try {
    const response = await bySpaceId(sid);
    res.json(response);
  } catch (e) {
    res.status(stc(e)).json({ error: e.error, message: e.message });
  }
};

module.exports = {
  getSpotById,
};
