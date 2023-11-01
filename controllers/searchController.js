const { byAddr, byCity, byZip, byOccupied } = require("../queries/search");

const { stc } = require("../lib/helper/helper");

const getSpaceByAddr = async (req, res) => {
  const addr = req.params.addr;
  await byAddr(addr)
    .then((response) => {
      res.json(response);
    })
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

const getSpaceByCity = async (req, res) => {
  const city = req.params.city;
  await byCity(city)
    .then((response) => {
      res.json(response);
    })
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

const getSpaceByZip = async (req, res) => {
  const zip = req.params.zip;
  await byZip(zip)
    .then((response) => {
      res.json(response);
    })
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

const getSpaceByIsOccupied = async (req, res) => {
  const bool = req.params.B;
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
  getSpaceByAddr,
  getSpaceByCity,
  getSpaceByZip,
  getSpaceByIsOccupied,
};
