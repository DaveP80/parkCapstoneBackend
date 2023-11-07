const {
    byTimeAndZ
  } = require("../queries/booking");
  
  const { stc } = require("../lib/helper/helper");
  //Search Endpoint for MainImage search bar.
  const getAvailSpaces = async (req, res) => {
    await byTimeAndZ([req.query.zip, req.query.addr, req.query.start, req.query.end])
      .then((response) => res.json(response))
      .catch((e) =>
        res.status(stc(e)).json({ error: e.error, message: e.message })
      );
  };
 
  module.exports = {
getAvailSpaces
  };
  