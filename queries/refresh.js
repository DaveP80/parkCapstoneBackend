const jwt = require("jsonwebtoken");
const db = require("../db/dbConfig");
require("dotenv").config();
const {
  TokenError,
  RefreshError,
} = require("../lib/errorHandler/customErrors");
const { getRoles } = require("../lib/helper/helper");

const makeToken = async (data) => {
  try {
    let foundUser = await db.any(
      `with cte as(
        select
          *
        from
          refresh_tokens
        where
          token = $1)
        select
          c.client_id id,
          cu.client_background_verified,
          cu.pmt_verified,
          r.renter_address,
          r.background_verified,
          r.r_pmt_verified
        from
          cte c
        left join client_user cu on
          c.client_id = cu.id
        left join renter_user r on
          c.client_id = r.renter_id`,
      data,
    );
    if (foundUser?.length == 0)
      throw new TokenError(
        "Token lookup",
        "Refresh Token not found in database",
      );
    let email = "";
    let id = -1;

    jwt.verify(data, process.env.JWT_TOKENREF_SECRET_KEY, (err, decoded) => {
      if (err || foundUser[0].id !== decoded.id) {
        if (err.name === "TokenExpiredError") {
          throw new RefreshError("Refresh Token Expired");
        } else {
          throw new RefreshError("Credential Mismatch jwt-refresh");
        }
      }
      email = decoded.email;
      id = decoded.id;
    });
    const accessToken = jwt.sign(
      {
        id: id,
        email: email,
      },
      process.env.JWT_TOKEN_SECRET_KEY,
      { expiresIn: "15m" },
    );
    return {
      accessToken,
      roles: getRoles(foundUser[0]),
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
