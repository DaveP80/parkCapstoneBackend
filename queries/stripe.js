const stripe = require("stripe")(process.env.STRIPE_KEY);
const db = require("../db/dbConfig");
const nodemailer = require("nodemailer");
require("dotenv").config();

const htmlContent = `
  <html>
    <body>
      <h3>Details</h3>
      <p>address: $(address)</p>
      <p>space_no: $(space_no)</p>
      <p>booking ID: $(booking_id)</p>
      <p>start time: $(start_time)</p>
      <a href="$(url)" target="_blank">More Info</a>
    </body>
  </html>
`;

const sendConfEmail = async (email) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_ADD,
      pass: process.env.PASS,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_ADD,
    to: email[3],
    subject: `your new parking space is ready`,
    html: htmlContent
      .replace(
        "$(url)",
        process.env.NODE_ENV === "development"
          ? `http://localhost:3000/admin`
          : `https://carvalet.netlify.app/admin`,
      )
      .replace("$(address)", email[1])
      .replace("$(space_no)", email[2][0][0].space_no)
      .replace("$(booking_id)", email[0])
      .replace("$(start_time)", email[2][1]),
  };

  await transporter.sendMail(mailOptions);
};

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

const getTransactionsByUserId = async (id, booking_id) => {
  try {
    const results = await db.any(
      `select * from payment_transactions where user_pmt_id = $1 ${
        booking_id ? `and pmt_booking_id = ${booking_id} ` : ""
      }order by timestamp desc, pmt_booking_id`,
      id,
    );
    return results;
  } catch (e) {
    return e;
  }
};

const newTransaction = async (args, email) => {
  try {
    const result = await db.tx(async (t) => {
      const newTransactionId = await t.one(
        `
         INSERT INTO payment_transactions(user_pmt_id, expiry, pmt_booking_id)
         VALUES ($1, $2, $3) RETURNING pmt_id;`,
        args,
      );
      // pmt is verified.
      await t.none(
        `
          UPDATE client_user
          SET pmt_verified = true
          WHERE id = $1;`,
        args,
      );

      return newTransactionId;
    });

    await sendConfEmail(email);

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
