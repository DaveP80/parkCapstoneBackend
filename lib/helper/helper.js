function parsedMessage(text) {
  let splitted = text.split(" ");

  let messageString = splitted[1];

  let splittedV2 = messageString.split("=");

  let field = splittedV2[0].replace(/[()]/g, "");
  let message = splittedV2[1].replace(/[()]/g, "");

  return `${field} ${message} is taken, please try another ${field}`;
}
//status code builder
function stc(e) {
  let st = 500;
  if (e?.status && typeof e.status == "number") {
    st = e.status;
  }
  return st;
}

module.exports = {
  parsedMessage,
  stc,
};
