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

function getRoles(obj) {
  let roles;
  if (obj?.renter_address) {
    roles = {
      Client: {
        bckgr: obj["client_background_verified"],
        pmt: obj["pmt_verified"],
      },
      Renter: {
        bckgr: obj["background_verified"],
        pmt: obj["r_pmt_verified"],
      }    
    }
  } else if (!obj?.renter_address) {
    roles = {
      Client: {
        bckgr: obj["client_background_verified"],
        pmt: obj["pmt_verified"],
      },
      ClientOnly: true,
    }
  }
  return roles;
}

module.exports = {
  parsedMessage,
  stc,
  getRoles,
};
