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
  let jwtToken = jwt.sign(
    {
      email: email,
      password: hashedPassword,
    },
    process.env.JWT_TOKEN_SECRET_KEY,
    { expiresIn: "7d" }
  );

  try {
    const res = await db.any(
      `insert into client_user(first_name, last_name, address, email, password) values ($1, $2, $3, $4, $5) returning *`,
      [first_name, last_name, address, email, hashedPassword]
    );

    if (res[0]) {
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
      return { error: `User with email ${email} already exists.` };
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return { SMTPerror: `Email host server error` };
  }
};

const login = async (data) => {
  try {
    const { email, password } = data;

    const foundUser = await db.any(
      "SELECT * FROM users WHERE email = $1",
      email
    );

    if (foundUser.length === 0) {
      throw {
        message: "error",
        error: "User does not exists please go sign up",
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
            username: user.username,
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

module.exports = {
  getAllUsers,
  createUser,
  login,
};
