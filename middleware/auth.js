const { getUser } = require("../service/auth");
const { user } = require("../Model/user");

async function checkAuth(req, res, next) {
  const token = req.cookies?.uid;

  if (!token) {
    req.user = null;
    res.locals.user = null;
    return next();
  }

  const payload = getUser(token);
  if (!payload) {
    req.user = null;
    res.locals.user = null;
    return next();
  }

  const loggedInUser = await user.findById(payload._id);
  req.user = loggedInUser;
  res.locals.user = loggedInUser;
  next();
}

module.exports = { checkAuth };
