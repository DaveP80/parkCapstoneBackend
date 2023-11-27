const {
  createProperty,
  getPropInfo,
  spaceAndPropInfo,
  createSpaces,
  updateSpaces,
  updateBooking,
  createRenter,
  getSoldSpacesByOwnerId,
  getActiveByOwnerId,
  updateRenterAddress,
  getEarningsByOId
} = require("../queries/renters");

const { parsedMessage, stc } = require("../lib/helper/helper");

const createNewProperty = async (req, res, next) => {
  createProperty(req.body)
    .then((response) => {
      res.json(response);
    })
    .catch((e) => {
      res.status(stc(e)).json({ message: e.message, error: e.error });
    });
};
//Endpoint for getting data on existing parking spaces by property id, owner_id
const getPropAndSpaceInfo = async (req, res, next) => {
  const pid = req.query.pid;
  await spaceAndPropInfo(pid, req.user_id)
    .then((response) => res.json(response))
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

const updateSpaceInfo = async (req, res, next) => {
  await updateSpaces(req.body)
    .then((response) => res.json(response))
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

const updateBookingStatus = async (req, res, next) => {
  await updateBooking(req.body)
    .then((response) => res.json(response))
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

const createNewSpaces = async (req, res, next) => {
  try {
    const result = await createSpaces(req.body.data);

    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPropertyInfo = async (req, res, next) => {
  await getPropInfo(req.user_id)
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((e) => {
      res.status(stc(e)).json({ message: e.message, error: e.error });
    });
};

const getSoldSpaces = async (req, res, next) => {
  await getSoldSpacesByOwnerId(req.user_id)
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((e) => {
      res.status(stc(e)).json({ message: e.message, error: e.error });
    });
};

const getActiveBookings = async (req, res, next) => {
  await getActiveByOwnerId(req.user_id)
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((e) => {
      res.status(stc(e)).json({ message: e.message, error: e.error });
    });
};

const getEarningsByOwnerId = async (req, res, next) => {
  await getEarningsByOId(req.user_id)
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((e) => {
      res.status(stc(e)).json({ message: e.message, error: e.error });
    });
};

const createRenterFunc = async (req, res, next) => {
  createRenter(req.body)
    .then((response) => {
      res.json(response);
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
  getPropAndSpaceInfo,
  createNewProperty,
  getPropertyInfo,
  createNewSpaces,
  getSoldSpaces,
  getActiveBookings,
  updateSpaceInfo,
  updateBookingStatus,
  createRenterFunc,
  renterAddressUpdate,
  getEarningsByOwnerId
};
