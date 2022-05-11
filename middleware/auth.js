const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
dotenv.config();

const config = process.env;

const verifyToken = (req, res, next) => {
  
  let token = '';

  if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
        token = req.headers.authorization.split(" ")[1];
  } 

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWTSECRETKEY);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};

module.exports = verifyToken;