const jwt = require("jsonwebtoken");
const db = require("../db/dbConfig");
const nodemailer = require("nodemailer");
const { SQLError } = require("../lib/errorHandler/customErrors");

const htmlContent = `
  <html>
    <body>
      <h3>Hello, World!</h3>
      <h2>Hello, World!</h2>
      $(firstName) $(lastName)
      <a href="$(url)" target="_blank">Confirm your Account</a>
    </body>
  </html>
`;

const createRenter = async (data) => {
  const { id, email } = data;
  console.log(data);

  try {
    const res = await db.any(
      `insert into renter_user(renter_id, renter_address, renter_email) values ((select id from client_user where id = $1), (select address from client_user where id = $1), $2) returning *`,
      [id, email]
    );

    if (res[0]) {
      const renter_address = res[0]["renter_address"];
      let jwtToken = jwt.sign(
        {
          renter_address,
          email,
          id: res[0]["renter_id"],
        },
        process.env.JWT_TOKEN_SECRET_KEY,
        { expiresIn: "7d" }
      );

      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_ADD,
          pass: process.env.PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_ADD,
        to: email,
        subject: "welcome and confirm",
        html: htmlContent
          .replace(
            "$(url)",
            `http://localhost:3001/users/create-user/auth?k=${jwtToken}`
          )
          .replace("$(firstName)", first_name)
          .replace("$(lastName)", last_name),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);
      return { message: `Email sent to ${email} successfully` };
    } else {
      throw {
        message: `Email host server error`,
        error: "SMTP error",
        status: 403,
      };
    }
  } catch (error) {
    console.error("Error sending email:", error);
    throw {
      message: `User with email ${email} already exists.`,
      error: "Pg error",
      status: 409,
    };
  }
};

const getPropInfo = async (data) => {
  try {
    const results = await db.any(
      `select * from properties where owner_id = $1`,
      data
    );
    return results;
  } catch (e) {
    return e;
  }
};

const getSoldSpacesByOwnerId = async (id) => {
  try {
    const results = await db.any(
      `select
      distinct b.*,
      z.owner_id
    from
      bookings b
    join (
      select
        *
      from
        properties pr
      natural join parking_spaces ps
      where
        pr.owner_id = $1) z on
      b.booking_space_id = z.space_id order by booking_id desc`,
      id
    );
    return results;
  } catch (e) {
    throw e;
  }
};

const getActiveByOwnerId = async (id) => {
  try {
    const results = await db.any(
      `select
      distinct b.*, z.owner_id
    from
      bookings b
    join (
      select
        *
      from
        properties pr
      natural join parking_spaces ps
      where
        pr.owner_id = $1) z on
      b.booking_space_id = z.space_id
    where
      end_time <= CURRENT_TIMESTAMP + interval '10 hours'
      and is_occupied = true`,
      id
    );
    return results;
  } catch (e) {
    throw e;
  }
};

const spaceAndPropInfo = async (pid, uid) => {
  try {
    const spaces = await db.any(
      `select ps.*, case when space_id in (select booking_space_id from bookings where is_occupied = true) then 1 else null end as occupied, min(price) over(partition by sp_type) min_price_overtype from parking_spaces ps join 
      properties pr on ps.property_lookup_id = pr.property_id where pr.location_verified = true and property_lookup_id = $1 and 
      space_owner_id = $2 order by space_no asc`,
      [pid, uid]
    );
    return spaces;
  } catch (e) {
    throw e;
  }
};

const updateSpaces = async (args) => {
  const space_id = args.space_id;
  let arr = Object.keys(args.setRow);
  let vals = [...Object.values(args.setRow), space_id];
  try {
    const Row = await db.any(
      `UPDATE  parking_spaces SET ${arr
        .map((item, i) => {
          return `${item} = $${i + 1}`;
        })
        .join(", ")} where
        space_id = $${vals.length} RETURNING *`,
      vals
    );
    return Row;
  } catch (e) {
    throw e;
  }
};

const updateBooking = async (args) => {
  const booking_id = args.booking_id;
  let arr = Object.keys(args.setRow);
  let vals = [...Object.values(args.setRow), booking_id];
  try {
    const Row = await db.any(
      `UPDATE  bookings SET ${arr
        .map((item, i) => {
          return `${item} = $${i + 1}`;
        })
        .join(", ")} where
        booking_id = $${vals.length} RETURNING *`,
      vals
    );
    return Row;
  } catch (e) {
    throw e;
  }
};

const createProperty = async (body) => {
  try {
    const update = await db.any(
      `insert
        into
        properties (owner_id,
        prop_address,
        zip,
        number_spaces,
        billing_type,
        latitude,
        longitude,
        picture,
        location_verified
        )
      values ($1, $2, $3, $4, $5, $6, $7, $8, true) returning *`,
      [
        body.owner_id,
        body.prop_address,
        body.zip,
        body.number_spaces,
        body.billing_type,
        body.latitude,
        body.longitude,
        body.picture
      ]
    );
    return update[0];
  } catch (e) {
    throw e;
  }
};

const createSpaces = async (body) => {
  try {
    await db.tx(async (t) => {
      const queries = body.map((l) => {
        return t.none(
          `INSERT INTO 
          parking_spaces(space_owner_id, property_lookup_id, space_no, sp_type, price) 
          VALUES($1, $2, $3, $4, $5)`,
          [
            l.space_owner_id,
            l.property_lookup_id,
            l.space_no,
            l.sp_type,
            l.price,
          ]
        );
      });
      await t.batch(queries);
    });

    return {
      success: true,
      message: `${body.length} rows inserted successfully`,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const updateRenterAddress = async (addr, id) => {
  try {
    const update = await db.any(
      `update
      renter_user
    set
      renter_address = $1,
      background_verified = true
    where
      renter_id = $2 returning *`,
      [addr, id]
    );
    if (update.length == 0) throw new SQLError("Invalid renter entry");
    await db.any(
      `update auth_users set all_is_auth = true where user_id = $1 returning *`,
      update[0].renter_id
    );
    return {
      message: `updated renter address`,
      verified: true,
      data: update[0],
    };
  } catch (e) {
    if (e instanceof SQLError) throw e;
    else throw new SQLError("unable to update is_auth");
  }
};

module.exports = {
  createProperty,
  getPropInfo,
  spaceAndPropInfo,
  getSoldSpacesByOwnerId,
  getActiveByOwnerId,
  createSpaces,
  updateSpaces,
  updateBooking,
  createRenter,
  updateRenterAddress,
};
