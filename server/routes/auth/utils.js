/* 
  Authentication utilities
*/

const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  cookieJwtAuth: function (req, res, next) {
    const token = req.cookies.token;
    if (token == null || "") return res.sendStatus(401);
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  },
  getUserIdFromToken: function getUserIdFromToken(token) {
    return jwt.verify(token, process.env.TOKEN_SECRET).user_id;
  },
  checkBodyValid: function (body, expectedKeys) {
    // Function for testing whether body has been sent and contains expected keys
    const hasBody =
      Object.keys(body).length !== 0 && body.constructor === Object;
    const valid =
      hasBody && expectedKeys.every((key) => Object.keys(body).includes(key));
    return valid;
  },
};
