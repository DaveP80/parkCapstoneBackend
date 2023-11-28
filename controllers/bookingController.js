const {
  byUserId,
  byTimeAndZ,
  byTimeAndPropertyId,
  byGeoAndTime,
  makeNewBooking
} = require("../queries/booking");

const { stc } = require("../lib/helper/helper");
//Search Endpoint for MainImage search bar.
const getBookings = async (req, res) => {
  await byUserId(req.user_id)
    .then((response) => res.json(response))
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

const getAvailSpaces = async (req, res) => {
  await byTimeAndZ([
    req.query.zip,
    req.query.addr,
    req.query.start,
    req.query.end,
  ])
    .then((response) => res.json(response))
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

const getAvailSpacesGeo = async (req, res) => {
  await byGeoAndTime([req.query.lat, req.query.lng, req.query.start, req.query.end])
    .then((response) => res.json(response))
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

const getSpacesByTimeAndPropertyId = async (req, res) => {
  await byTimeAndPropertyId([req.query.pid, req.query.starts, req.query.ends])
    .then((response) => res.json(response))
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

const makeNewCheckoutB = async (req, res) => {
  await makeNewBooking(req.user_id, req.body.data)
    .then((response) => res.json(response))
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

module.exports = {
  getBookings,
  getAvailSpaces,
  getAvailSpacesGeo,
  getSpacesByTimeAndPropertyId,
  makeNewCheckoutB,
};
