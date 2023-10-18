const {
    getInfo,
  } = require("../queries/users");
  
  const { parsedMessage, stc } = require("../lib/helper/helper");
  
  const userProfile = async (req, res, next) => {
    await getInfo(req.user_id)
      .then((response) => {
        res.status(200).json(response)
      }).catch((e) => {
        res.status(stc(e)).json({ error: e.error, message: e.message });
      });
  };
  
  module.exports = {
    userProfile,
  };
  