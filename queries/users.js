const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/dbConfig");
const nodemailer = require("nodemailer");
const {
  UserAlreadyExistsError,
  EmailHostError,
  SQLError,
  PasswordError,
  AuthError,
  MultiStatusError,
  TokenError,
} = require("../lib/errorHandler/customErrors");

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
    const checkLogs = await db.any(
      `select * from auth_users where user_email=$1`,
      email
    );
    if (checkLogs[0]) {
      throw new UserAlreadyExistsError(
        `Cannot register with a previously used email: ${email}`
      );
    }
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
            //`http://localhost:3001/users/create-user/auth?k=${jwtToken}`
            `http://localhost:3000/confirmation?k=${jwtToken}`
          )
          .replace("$(firstName)", first_name)
          .replace("$(lastName)", last_name),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);
      return { message: `Email sent to ${email} successfully` };
    } else {
      throw new EmailHostError(`Email host server error`);
    }
  } catch (error) {
    if (
      error instanceof UserAlreadyExistsError ||
      error instanceof EmailHostError
    ) {
      throw error;
    } else
      throw new UserAlreadyExistsError(
        `User with email ${email} already exists.`
      );
  }
};

const login = async (data) => {
  try {
    const { email, password } = data;

    const foundUser = await db.any(
      `select
      c.*,
      r.email renter_email,
      au.is_auth bckgr_verify 
    from
      client_user c
    left join renter_user r on
      c.id = r.renter_id
    left join auth_users au on
      c.id = au.user_id
    where
      c.email = $1
      and c.is_auth = true;`,
      email
    );

    if (foundUser.length === 0) {
      throw new PasswordError("Login Error", "Invalid email address");
    } else {
      let user = foundUser[0];

      let comparedPassword = await bcrypt.compare(password, user.password);

      if (!comparedPassword) {
        throw new PasswordError(
          "unauthorized",
          "Please check your email and password"
        );
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
          { expiresIn: 180 * 24 * 60 * 60 }
        );

        await db.any(
          `insert into refresh_tokens(client_id, token) values ($1, $2) returning *`,
          [user.id, jwtTokenRefresh]
        );

        return { accessToken: [jwtToken, jwtTokenRefresh], email, roles: [1, user.renter_email ? 2 : 0], bckgr_verify: user.bckgr_verify };
      }
    }
  } catch (e) {
    throw new SQLError(e);
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
      throw new AuthError(`Invalid id: ${id}`);
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
          throw new MultiStatusError(JSON.stringify(e), sqlArr);
        }
      }
      return sqlArr;
    }
  } catch (e) {
    if (e instanceof MultiStatusError || e instanceof AuthError) {
      throw e;
    } else throw { message: "server error", error: e.name, status: 500 };
  }
};

const getInfo = async (args) => {
  try {
    const userJoin = await db.any(
      `select c.id, c.first_name, c.last_name, c.address clientAddress, c.email clientEmail, c.pmt_verified clientPmtVerify, r.address renterAddress, r.email renterEmail, r.background_verified renterBackground, r.pmt_verified renterPmtVerify, auth_users.is_auth from (select * from client_user where id=$1) c left join renter_user r on c.id = r.renter_id join auth_users on c.id = auth_users.user_id`,
      args
    );
    if (userJoin.length === 0) {
      throw new TokenError(
        "Invalid lookup id",
        "refresh token not found in db"
      );
    } else {
      if (userJoin[0]['renteraddress']) userJoin[0]['roles'] = [1,2];
      if (!userJoin[0]['renteraddress']) userJoin[0]['roles'] = [1];
      return userJoin[0];
    }
  } catch (e) {
    if (e instanceof TokenError) throw e;
    else;
    throw {
      error: e.name,
      message: e.message,
      status: 500,
    };
  }
};

module.exports = {
  getAllUsers,
  createUser,
  login,
  authLogin,
  getInfo,
};
