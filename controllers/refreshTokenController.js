const { makeToken } = require("../queries/refresh");

const { parsedMessage, stc } = require("../lib/helper/helper");

const handleRefreshToken = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.accessToken) return res.sendStatus(401);
  const refreshToken = cookies.accessToken;

  await makeToken(refreshToken)
    .then((response) => {
      res.json(response);
    })
    .catch((e) =>
      res.status(stc(e)).json({ error: e.error, message: e.message })
    );
};

module.exports = handleRefreshToken;
