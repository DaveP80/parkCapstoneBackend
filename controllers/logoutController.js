const { deleteToken } = require("../queries/logout");

function clearCookie(r) {
    r.clearCookie('accessToken', { httpOnly: true, sameSite: 'None', secure: true });
    r.sendStatus(204);
}

const handleLogout = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.accessToken) return res.sendStatus(204); //No content
    const refreshToken = cookies.accessToken;
    await deleteToken(refreshToken).then(res => {
        clearCookie(res);
    }).catch(e => clearCookie(res))

}

module.exports =  handleLogout 