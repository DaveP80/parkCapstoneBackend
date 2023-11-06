const zipCodePattern = /\b\d{5}(?:-\d{4})?\b/g;

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
      },
    };
  } else if (!obj?.renter_address) {
    roles = {
      Client: {
        bckgr: obj["client_background_verified"],
        pmt: obj["pmt_verified"],
      },
      ClientOnly: true,
    };
  }
  return roles;
}

function removeZipCode(args) {
  const extractedZipCodes = [];
  const modifiedString = args.replace(zipCodePattern, (match) => {
    extractedZipCodes.push(match);
  });
  return [modifiedString, extractedZipCodes];
}

function splitStringIntoSubstrings(inputString) {
  const maxSubstringLength = 3;
  const substrings = [];

  for (let i = 0; i < inputString.length; i += maxSubstringLength) {
    substrings.push(inputString.slice(i, i + maxSubstringLength));
  }

  return substrings;
}

function closeZipCodes(targetZipcode, zipcodes) {
  let store = {};

  let MAX_SCORE = (args) => {
    let sc = 0;
    for (let i = 1; i <= args.length; i++) {
      sc += i;
    }
    return sc;
  };
  const MS = MAX_SCORE(targetZipcode);

  function calculateZipcodeSimilarity(zipcode1, zipcode2) {
    if (zipcode1.length !== zipcode2.length) {
      return MAX_SCORE(zipcode2);
    }
    let fs = 0;
    for (let i = 0, s = zipcode1.length; i < zipcode1.length; i++, s--) {
      if (zipcode1.charAt(i) == zipcode2.charAt(i)) fs += s;
    }
    store[zipcode2] = fs;
    return fs;
  }

  zipcodes.sort((zipcode1, zipcode2) => {
    const similarity1 = calculateZipcodeSimilarity(targetZipcode, zipcode1);
    const similarity2 = calculateZipcodeSimilarity(targetZipcode, zipcode2);

    return similarity2 - similarity1;
  });
  store[targetZipcode] = MS;
  let f = zipcodes.filter((item) => {
    return store[item] / MS > 0.6;
  });

  return f;
}

module.exports = {
  parsedMessage,
  stc,
  getRoles,
  removeZipCode,
  splitStringIntoSubstrings,
  closeZipCodes,
};
