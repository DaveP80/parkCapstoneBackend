const jwt = require("jsonwebtoken");

function authUserMiddleware(req, res, next) {
  const jwtToken = req.query.k;
  if (!jwtToken) {
    return res
      .status(400)
      .send("JWT Token (k) not provided in the query string");
  }

  try {
    const decoded = jwt.verify(jwtToken, process.env.JWT_TOKEN_SECRET_KEY);
    res.locals.decodedToken = decoded;

    next();
  } catch (error) {
    res.status(400).send("Invalid or expired JWT Token");
  }
}

function jwtMiddleware(req, res, next) {
  try {
    if (req.headers && req.headers.authorization) {
      let notDecodedToken = req.headers.authorization;

      let slicedToken = notDecodedToken.slice(7);

      let decodedToken = jwt.verify(
        slicedToken,
        process.env.JWT_TOKEN_SECRET_KEY
      );

      res.locals.decodedData = decodedToken;

      next();
    } else {
      throw { message: "You don't have permission" };
    }
  } catch (e) {
    res.status(500).json({ message: "error", error: e.message });
  }
}

module.exports = { authUserMiddleware, jwtMiddleware };
