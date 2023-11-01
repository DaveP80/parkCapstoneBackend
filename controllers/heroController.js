const { getAll, getSpace } = require("../queries/search");

const { stc } = require("../lib/helper/helper");

const getAllSpaces = async (req, res) => {
  await getAll()
    .then((response) => {
      res.json(response);
    })
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

const getOneSpace = async (req, res) => {
  await getSpace()
    .then((response) => {
      res.json(response);
    })
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

module.exports = getAllSpaces;
