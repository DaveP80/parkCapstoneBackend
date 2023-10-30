const { deleteToken } = require("../queries/logout");

function clearCookie(r) {
  r.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  });
  r.json({});
}

const handleLogout = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.accessToken) {
    return res.json({});
  }

  const refreshToken = cookies.accessToken;
  try {
    await deleteToken(refreshToken);
    clearCookie(res);
  } catch (e) {
    clearCookie(res);
  }
};

module.exports = handleLogout;
