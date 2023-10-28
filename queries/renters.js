const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/dbConfig");
const nodemailer = require("nodemailer");

const htmlContent = `
  <html>
    <body>
      <h3>Hello, World!</h3>
      $(firstName) $(lastName)
      <a href="$(url)" target="_blank">Confirm your Account</a>
    </body>
  </html>
`;

const createRenter = async (data) => {
  const { id, first_name, last_name, email } = data;
  console.log(data);

  try {
    const res = await db.any(
      `insert into renter_user(renter_id, first_name, last_name, renter_email) values ((select id from client_user where id = $1), (select first_name from client_user where first
        _name = $2 and id = $1), (select last_name from client_user where last
            _name = $3 and id = $1), $4) returning *`,
      [id, first_name, last_name, email]
    );

    if (res[0]) {
      let jwtToken = jwt.sign(
        {
          first_name,
          last_name,
          email,
          id: res[0]["id"],
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

const login = async (data) => {
  try {
    const { email, password } = data;

    const foundUser = await db.any(
      "SELECT * FROM renter_user WHERE id = $1",
      email
    );

    if (foundUser.length === 0) {
      throw {
        message: "error",
        error: "Invalid email address",
      };
    } else {
      let user = foundUser[0];

      let comparedPassword = await bcrypt.compare(password, user.password);

      if (!comparedPassword) {
        throw {
          message: "error",
          error: "Please check your email and password",
          status: 500,
        };
      } else {
        let jwtToken = jwt.sign(
          {
            id: user.id,
            email: user.email,
          },
          process.env.JWT_TOKEN_SECRET_KEY,
          { expiresIn: "7d" }
        );

        return jwtToken;
      }
    }
  } catch (e) {
    return e;
  }
};

const authLogin = async (id) => {
  try {
    const auUser = await db.any(
      "Update client_user set is_auth = true where id=$1 returning *",
      id
    );

    if (auUser.length === 0) {
      throw {
        message: `Invalid id: ${id}`,
        error: `check id for unauthenticated user`,
        status: 403,
      };
    } else {
      return auUser[0];
    }
  } catch (e) {
    throw { message: "server error", error: JSON.stringify(e), status: 500 };
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
      return { message: `updated renter address`, verified: true, data: update[0] };
    } catch (e) {
      if (e instanceof SQLError) throw e;
      else throw new SQLError("unable to update is_auth");
    }
  };

module.exports = {
  createRenter,
  login,
  authLogin,
  updateRenterAddress,
};
