const jwt = require('jsonwebtoken');
const secret = "Krish@1911";

function setUser(user) {
  return jwt.sign({
      _id: user._id,
      email: user.email,
  }, secret, { expiresIn: '1d' });
}


function getUser(token) {
    if (!token) return null;
    try {
        const payload = jwt.verify(token, secret);
        return payload;
    } catch (error) {
        return null;
    }
}

module.exports = {
    setUser,
    getUser
};