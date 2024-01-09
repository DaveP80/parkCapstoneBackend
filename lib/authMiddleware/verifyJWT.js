const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(" ")[1];
  let cookies = req.cookies;
  if (cookies?.accessToken) {
    cookies = req.cookies.accessToken;
  } else {
    cookies = null;
  }
  if (cookies) {
    let refreshDecoded = jwt.decode(cookies);
    let decoded15min = jwt.decode(token);

    if (refreshDecoded?.id != decoded15min?.id) {
      return res.sendStatus(401);
    }
  }
  jwt.verify(token, process.env.JWT_TOKEN_SECRET_KEY, (err, decoded) => {
    if (err) return res.sendStatus(403); //invalid token
    req.user_id = decoded.id;
    next();
  });
};

module.exports = verifyJWT;

