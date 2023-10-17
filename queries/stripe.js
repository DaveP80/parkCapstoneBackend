const stripe = require("stripe")(process.env.STRIPE_KEY);

const confirmPmt = async (data) => {
  try {
    const { id, amount, } = data;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ['card']
    });
    //client secret is used to display checkout ui
    return {
      clientSecret: paymentIntent.client_secret
    };
  } catch (error) {
    // Handle errors
    throw {
      error: error.message,
      status: 500,
    };
  }
};

module.exports = {
  confirmPmt,
};
