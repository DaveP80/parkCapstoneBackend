const {
  createRenter,
  createProperty,
  getPropInfo,
  updateRenterAddress,
} = require("../queries/renters");

const { parsedMessage, stc } = require("../lib/helper/helper");

const createRenterFunc = async (req, res, next) => {
  createRenter(req.body)
    .then((response) => {
      res.json(response);
    })
    .catch((e) => {
      res.status(stc(e)).json({ message: e.message, error: e.error });
    });
};

const createNewProperty = async (req, res, next) => {
  createProperty(req.body)
    .then((response) => {
      res.json(response);
    })
    .catch((e) => {
      res.status(stc(e)).json({ message: e.message, error: e.error });
    });
};
//Endpoint for authenticating user after they click emaillink
const authCreateRenter = async (req, res, next) => {};

const getPropertyInfo = async (req, res, next) => {
  await getPropInfo(req.user_id)
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((e) => {
      res.status(stc(e)).json({ message: e.message, error: e.error });
    });
};

const renterAddressUpdate = async (req, res, next) => {
  await updateRenterAddress(req.body.address, req.user_id)
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((e) => {
      res.status(stc(e)).json({ error: e.error, message: e.message });
    });
};

module.exports = {
  createRenterFunc,
  createNewProperty,
  getPropertyInfo,
  authCreateRenter,
  renterAddressUpdate,
};
