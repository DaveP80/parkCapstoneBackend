const {
    confirmPmt,
  } = require("../queries/stripe");
  
  const confirmUserPmt = async (req, res, next) => {

    confirmPmt(req.body)
      .then((response) => {
        res.status(200).json(response);
      })
      .catch((e) => {
        res.status(stc(e)).json({ error: e.error });
      });
  };

  module.exports = {
    confirmUserPmt,
  };  