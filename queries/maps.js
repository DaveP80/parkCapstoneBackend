const axios = require('axios');

const apiKey = process.env.GOOGLE_MAPS_API_KEY;

const verifyLocationAddr = async(addressToVerify) => {
    
    let response = await axios
      .get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: addressToVerify,
          key: apiKey,
        },
      })
      .then((response) => {
        const results = response.data.results;
        console.log(results);
    
        if (results.length > 0) {

          return { confirm: true, formattedAddress: results[0].formatted_address};
        } else {
            return { confirm: false, formattedAddress: '' };
        }
      })
      .catch((error) => {
        return { error: error, message: 'api axios request error'};
      });



}

module.exports = {
    verifyLocationAddr
}