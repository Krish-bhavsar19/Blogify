const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign(req.user, process.env.JWT_SECRET, { expiresIn: '1h' });
    

    res.cookie('uid', token, { httpOnly: true });
    res.redirect('/');
  }
);



module.exports = router;
