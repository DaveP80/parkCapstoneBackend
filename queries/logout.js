const db = require("../db/dbConfig");
require('dotenv').config();
const {
  SQLError,
} = require("../lib/errorHandler/customErrors");

const deleteToken = async (data) => {
  try {
    await db.one(
      `delete from refresh_tokens where token = $1`,
      data
    );
    return true;
  } catch (e) {
    throw new SQLError(e);
  }
};

module.exports = {
  deleteToken,
};
