const axios = require("axios");
const { byAddr, byAddrB, byCity, byZip, byOccupied } = require("../queries/search");

const { stc } = require("../lib/helper/helper");

const getSpaceByAddr = async (req, res) => {
  const addr = req.body.addr;

  try {
    const response = await byAddr(addr);

    if (response[0]?.requery) {
      const postResponse = await axios.post(
        `${process.env.NODE_URI}/get-spaces/zip/z`,
       { zip: response[0]}
      );
      res.json(postResponse.data);
    } else {
      res.json(response);
    }
  } catch (e) {
    res.status(e.status || 500).json({ error: e.error, message: e.message });
  }
};

const getSpaceByAddrB = async (req, res) => {
  const addr = req.body.addr;

  try {
    const response = await byAddrB(addr);

    if (response[0]?.requery) {
      const postResponse = await axios.post(
        `${process.env.NODE_URI}/get-spaces/zip/z`,
       { zip: response[0]}
      );
      res.json(postResponse.data);
    } else {
      res.json(response);
    }
  } catch (e) {
    res.status(e.status || 500).json({ error: e.error, message: e.message });
  }
};

const getSpaceByCity = async (req, res) => {
  const city = req.body.city;
  await byCity(city)
    .then((response) => {
      res.json(response);
    })
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

const getSpaceByZip = async (req, res) => {
  const zip = req.body.zip;
  await byZip(zip)
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
  getSpaceByAddr,
  getSpaceByAddrB,
  getSpaceByCity,
  getSpaceByZip,
  getSpaceByIsOccupied,
};
