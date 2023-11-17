const stripe = require("stripe")(process.env.STRIPE_KEY);
const db = require("../db/dbConfig");
const confirmPmt = async (data) => {
  try {
    const { id, amount, quantity } = data.items[0];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      quantity: quantity,
      id: id,
      payment_method_types: ["card"],
    });
    //client secret is used to display checkout ui
    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    // Handle errors
    throw {
      error: error.message,
      status: 500,
    };
  }
};

const getTransactionsByUserId = async (id) => {
  try {
    const results = await db.any(
      `select * from payment_transactions where user_pmt_id = $1 order by timestamp desc, pmt_booking_id`,
      id
    );
    return results;
  } catch (e) {
    return e;
  }
};

const newTransaction = async (args) => {
  try {
    const result = await db.tx(async (t) => {
      const newTransactionId = await t.one(
        `
         INSERT INTO payment_transactions(user_pmt_id, expiry, pmt_booking_id)
         VALUES ($1, $2, $3) RETURNING pmt_id;`,
        args
      );
      // pmt is verified.
      await t.none(
        `
          UPDATE client_user
          SET pmt_verified = true
          WHERE id = $1;`, args
      );

      return newTransactionId;
    });

    return {
      success: true,
      message: `payment for booking_id: ${args[2]}`,
      pmt_id: result.pmt_id,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  confirmPmt,
  newTransaction,
  getTransactionsByUserId,
};
