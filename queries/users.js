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

const getAllUsers = async () => {
  try {
    const allUsers = await db.any("SELECT * FROM client_user");

    return allUsers;
  } catch (e) {
    return e;
  }
};

const createUser = async (data) => {
  const { first_name, last_name, address, password, email, is_renter } = data;
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
          first_name,
          last_name,
          email,
          is_renter,
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
    const { email, password, } = data;

    const foundUser = await db.any(
      "SELECT * FROM client_user WHERE email = $1 and is_auth=true",
      email
    );

    if (foundUser.length === 0) {
      throw {
        message: "error",
        error: "Invalid email address",
        status: 401
      };
    } else {
      let user = foundUser[0];

      let comparedPassword = await bcrypt.compare(password, user.password);

      if (!comparedPassword) {
        throw {
          message: "unauthorized",
          error: "Please check your email and password",
          status: 401,
        };
      } else {
        let jwtToken = jwt.sign(
          {
            id: user.id,
            email: user.email,
          },
          process.env.JWT_TOKEN_SECRET_KEY,
          { expiresIn: "15m" }
        );

        let jwtTokenRefresh = jwt.sign(
          {
            id: user.id,
            email: user.email,
          },
          process.env.JWT_TOKENREF_SECRET_KEY,
          { expiresIn: "6M" }
        );

        return {tokens: [jwtToken, jwtTokenRefresh]};
      }
    }
  } catch (e) {
    throw {
      message: 'sql server error',
      error: JSON.stringify(e),
      status: 500
    }
  }
};
//when a user clicks on email confirmation link
const authLogin = async (id, is_renter) => {
  try {
    const auUser = await db.any(
      "Update client_user set is_auth = true where id in (select id from client_user where id=$1 and is_auth=false) returning *",
      id
    );

    if (auUser.length === 0) {
      throw {
        message: `Invalid id: ${id}`,
        error: `check id for unauthenticated user`,
        status: 403,
      };
    } else {
      let sqlArr = auUser[0];
      if (is_renter) {
        try {
          const makeRenter = await db.any(
            `insert into renter_user(renter_id, first_name, last_name, address, email) values ((select id from client_user where id = $1), (select first_name from client_user where first_name = $2 and id = $1), (select last_name from client_user where last_name = $3 and id = $1), $4, $5) returning *`,
            [
              sqlArr.id,
              sqlArr.first_name,
              sqlArr.last_name,
              sqlArr.address,
              sqlArr.email,
            ]
          );

          sqlArr["renterInfo"] = makeRenter[0];
        } catch (e) {
          throw {
            message: "Multi-status error on making renter entity",
            error: JSON.stringify(e),
            clientUser: sqlArr,
            status: 207,
          };
        }
      }
      return sqlArr;
    }
  } catch (e) {
    throw { message: "server error", error: e.name, status: 500 };
  }
};

const getInfo = async(args) => {
  try {
    const userJoin = await db.any(`select * from (select * from client_user where id=$1) c left join renter_user r on c.id = r.renter_id join auth_users on c.id = auth_users.user_id`, args.id)
    if (userJoin.length === 0) {
      throw {
        message: "error",
        error: "Invalid lookup id",
        status: 401
      };
  } else {
    return userJoin[0]
  }
} catch(e) {
  throw {
    error: e.name,
    message: e.message,
    status: 500
  }
}
}

module.exports = {
  getAllUsers,
  createUser,
  login,
  authLogin,
  getInfo,
};
