const jwt = require("jsonwebtoken");
const db = require("../db/dbConfig");
require("dotenv").config();
const {
  TokenError,
  RefreshError,
} = require("../lib/errorHandler/customErrors");

const makeToken = async (data) => {
  try {
    let foundUser = await db.any(
      `with cte as(select * from refresh_tokens where token = $1) select c.client_id, r.renter_id from cte c left join renter_user r on c.client_id = r.renter_id`,
      data
    );
    if (foundUser?.length == 0)
      throw new TokenError(
        "Token lookup",
        "Refresh Token not found in database"
      );
    let email = "";
    let id = -1;
    jwt.verify(data, process.env.JWT_TOKENREF_SECRET_KEY, (err, decoded) => {
      if (err || foundUser[0].client_id !== decoded.id)
        throw new RefreshError("Refresh Token Exp");
      email = decoded.email;
      id = decoded.id;
    });
    const accessToken = jwt.sign(
      {
        id: id,
        email: email,
      },
      process.env.JWT_TOKEN_SECRET_KEY,
      { expiresIn: "15m" }
    );
    return {
      accessToken,
      email,
      roles: [1, foundUser[0].renter_id ? 2 : 0],
      id: foundUser[0].client_id,
    };
  } catch (error) {
    if (error instanceof TokenError || error instanceof RefreshError) {
      throw error;
    } else
      throw {
        message: `Server Error`,
        error: "Auth Error",
        status: 500,
      };
  }
};

module.exports = {
  makeToken,
};
