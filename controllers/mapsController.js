const {
    verifyLocationAddr,
  } = require("../queries/maps");
  
  const verifyAddressFromForm = async (req, res, next) => {

    verifyLocationAddr(req.body.addr)
      .then((response) => {
        res.status(200).json(response);
      })
      .catch((e) => {
        res.status(stc(e)).json({ error: e.error });
      });
  };

  module.exports = {
    verifyAddressFromForm,
  };  