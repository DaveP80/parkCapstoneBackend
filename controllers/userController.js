const {
  getAllUsers,
  createUser,
  login,
  authLogin,
  getInfo,
} = require("../queries/users");

const { parsedMessage, stc } = require("../lib/helper/helper");

const allGetUsersFunc = async (req, res) => {
  const allUsers = await getAllUsers();

  console.log(res.locals.decodedData);

  if (allUsers.length === 0) {
    res.json({ message: "please go create some users" });
  } else {
    res.json(allUsers);
  }
};

const createUserFunc = async (req, res, next) => {
  createUser(req.body)
    .then((response) => {
      res.json(response);
    })
    .catch((e) => {
      res.status(stc(e)).json({ message: e.message, error: e.error });
    });
};
//Endpoint for authenticating user after they click emaillink
const authCreateUser = async (req, res, next) => {
  const { first_name, last_name, email, id, is_renter } =
    res.locals.decodedData;
  authLogin(id, is_renter)
    .then((response) => {
      res.status(201).json(response);
    })
    .catch((e) => {
      if (e.hasOwnProperty("clientUser")) {
        res.status(stc(e)).json(e);
      } else {
        res.status(stc(e)).json({ message: e.message, error: e.error });
      }
    });
};

const loginFunc = async (req, res, next) => {
  await login(req.body)
    .then((response) => {
      res.cookie('accessToken', response.tokens[1], {
        httpOnly: true,
        secure: true,
        maxAge: 15000,
        sameSite: 'None'
      }).json({
        accessToken: response.tokens[0]
        });
    }).catch((e) => {
      res.status(stc(e)).json(e);
    });
};

const userProfile = async (req, res, next) => {
  await getInfo(res.locals.decodedData)
    .then((response) => {
      res.json(response)
    }).catch((e) => {
      res.status(stc(e)).json({ error: e.error, message: e.message });
    });
};

module.exports = {
  allGetUsersFunc,
  createUserFunc,
  loginFunc,
  authCreateUser,
  userProfile,
};
