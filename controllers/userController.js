const jwt = require("jsonwebtoken");
const { getAllUsers, createUser, login } = require("../queries/users");

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
      if (response?.error) {
        throw {
          message: response.error,
          status: 409,
        };
      } else if (response?.SMTPerror) {
        throw {
          message: response.SMTPerror,
          status: 409,
        };
      } else if (response?.message) {
        res.json({ message: "Email sent" });
      } else {
        res.status(500).json({ error: "database or email error" });
      }
    })
    .catch((e) => {
      res.status(500).json({ error: "server error" });
    });
};

const authCreateUser = async (req, res, next) => {
  const jwtToken = req.query.k;
  if (jwtToken) {
    const decoded = jwt.verify(jwtToken, process.env.JWT_TOKEN_SECRET_KEY);

    const { email, password } = decoded;

    const authLogin = await login({ email: email, password: password });
  } else {
    res.status(400).send("JWT Token (k) not provided in the query string");
  }
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
