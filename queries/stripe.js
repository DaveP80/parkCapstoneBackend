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

      return newTransactionId;
    });

    return {
      success: true,
      message: `payment for booking_id: ${2}`,
      pmt_id: result.pmt_id,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};


// const newTransaction = async (args) => {
//   let newTransactionId;
//   try {
//     await db.tx(async (t) => {
//       const query = `
//           insert into payment_transactions(user_pmt_id, expiry, pmt_booking_id)
//           values ($1, $2, $3) returning pmt_id;`;
//       try {
//         const result = await t.one(query, args);
//         newTransactionId = result.pmt_id;
//       } catch (error) {
//         throw error;
//       }
//     });
//     return {
//       success: true,
//       message: `payment for booking_id: ${2}`,
//       pmt_id: newTransactionId,
//     };
//   } catch (error) {
//     throw error;
//   }
// };

module.exports = {
  confirmPmt,
  newTransaction,
  getTransactionsByUserId,
};
