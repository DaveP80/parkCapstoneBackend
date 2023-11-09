const {
  byZipOrAddr,
  byAddrB,
  byOccupied,
  byZip,
} = require("../queries/search");

const { stc } = require("../lib/helper/helper");
//Search Endpoint for MainImage search bar.
const getSpaceByZA = async (req, res) => {
  await byZipOrAddr(req.query.zipCode, req.query.addr)
    .then((response) => res.json(response))
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

const getSpaceByAddrB = async (req, res) => {
  const addr = req.body.addr;

  try {
    const response = await byAddrB(addr);

    res.json(response);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.error, message: e.message });
  }
};

const getSpaceByZip = async (req, res) => {
  await byZip(req.body)
    .then((response) => {
      res.json(response);
    })
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

const getSpaceByIsOccupied = async (req, res) => {
  const bool = req.body.B;
  const city = req.params.city;
  await byOccupied([bool, city])
    .then((response) => {
      res.json(response);
    })
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

module.exports = {
  getSpaceByZA,
  getSpaceByAddrB,
  getSpaceByZip,
  getSpaceByIsOccupied,
};
