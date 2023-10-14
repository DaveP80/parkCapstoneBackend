const {
  getAllUsers,
  createUser,
  login,
  authLogin,
} = require("../queries/users");

const { parsedMessage } = require("../lib/helper/helper");

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
      let st = 500;
      if (e?.status && typeof e.status == "number") {
        st = e.status;
      }
      res.status(st).json({ message: e.message, error: e.error });
    });
};

const authCreateUser = async (req, res, next) => {
  const { email, password, id } = res.locals.decodedToken;
  authLogin({ email, password, id })
    .then((response) => {
      res.status(201).json(response);
    })
    .catch((e) => {
      let st = 500;
      if (e?.status && typeof e.status == "number") {
        st = e.status;
      }
      res.status(st).json({ message: e.message, error: e.error });
    });
};

const loginFunc = async (req, res, next) => {
  try {
    const foundUser = await login(req.body);

    if (foundUser.status === 500) {
      throw foundUser;
    } else {
      res.json({ token: foundUser });
    }
  } catch (e) {
    res.status(500).json({ message: e.message, error: e.error });
  }
};

module.exports = {
  allGetUsersFunc,
  createUserFunc,
  loginFunc,
  authCreateUser,
};
