const { createRenter, login, authLogin } = require("../queries/renters");

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
//Endpoint for authenticating user after they click emaillink
const authCreateRenter = async (req, res, next) => {
  const { first_name, last_name, email, id } = res.locals.decodedToken;
  authLogin(id)
    .then((response) => {
      res.status(201).json(response);
    })
    .catch((e) => {
      res.status(stc(e)).json({ message: e.message, error: e.error });
    });
};

const loginFunc = async (req, res, next) => {
  try {
    const foundRenter = await login(req.body);

    if (foundRenter.status === 500) {
      throw foundRenter;
    } else {
      res.json({ accessToken: foundRenter });
    }
  } catch (e) {
    res.status(500).json({ error: e.error });
  }
};

module.exports = {
  createRenterFunc,
  loginFunc,
  authCreateRenter,
};
