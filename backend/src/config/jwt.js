require("dotenv").config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || "defaultsecret",
  jwtExpire: "1d",
};
