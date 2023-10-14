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

// const newUser = db.one(
//   "INSERT INTO client_user (first_name, last_name, address, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING *"
//   //[firstName, lastName, address, email, hashedPassword, auth_str]
// );

//let salt = await bcrypt.genSalt(10);

//let hashedPassword = await bcrypt.hash(password, salt);
const getAllUsers = async () => {
  try {
    const allUsers = await db.any("SELECT * FROM client_user");

    return allUsers;
  } catch (e) {
    return e;
  }
};

const createUser = async (data) => {
  const { first_name, last_name, address, password, email } = data;
  console.log(data);

  let salt = await bcrypt.genSalt(10);

  let hashedPassword = await bcrypt.hash(password, salt);

  try {
    const res = await db.any(
      `insert into client_user(first_name, last_name, address, email, password) values ($1, $2, $3, $4, $5) returning *`,
      [first_name, last_name, address, email, hashedPassword]
    );

    if (res[0]) {
      let jwtToken = jwt.sign(
        {
          email: email,
          password: hashedPassword,
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
      "SELECT * FROM client_user WHERE email = $1 and is_auth=true",
      email
    );

    if (foundUser.length === 0) {
      throw {
        message: "error",
        error: "Invalid email credential",
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

const authLogin = async (data) => {
  try {
    const { email, password, id } = data;

    const auUser = await db.any(
      "Update client_user set is_auth = true where id=$1 and password=$2 returning *",
      [id, password]
    );

    if (auUser.length === 0) {
      throw {
        message: "Invalid id and password",
        error: `check id ${id} password ${password.slice(0, 10)}...`,
        status: 403,
      };
    } else {
      return auUser[0];
    }
  } catch (e) {
    throw { message: "server error", error: JSON.stringify(e), status: 500 };
  }
};

module.exports = {
  getAllUsers,
  createUser,
  login,
  authLogin,
};
