const { Router } = require("express");
const { randomBytes, createHmac } = require("crypto");
const { user } = require("../Model/user");
const { Post } = require("../Model/post");
const { setUser, getUser } = require('../service/auth');
const router = Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router
  .get("/signup", (req, res) => res.render("signup"))
  .post('/signup', async (req, res) => {
    const { username, password, email } = req.body;

    try {
      const existingUser = await user.findOne({ email });
      if (existingUser) {
        return res.render("signup", {
          error: "Email is already registered."
        });
      }

      const salt = randomBytes(16).toString("hex");
      const hashedPassword = createHmac("sha256", salt).update(password).digest("hex");

      await user.create({
        username,
        password: hashedPassword,
        email,
        salt
      });

      return res.redirect('/login');
    } catch (err) {
      console.error("Signup error:", err);
      return res.status(500).send("Something went wrong. Please try again.");
    }
  })
  .get('/login', (req, res) => {
    const redirect = req.query.redirect || '/';
    res.render('login', { redirect, error: null });
  })

  .post('/login', async (req, res) => {
    const { password, email, redirect} = req.body;
    const redirectPath = redirect || '/';
    try {
      const foundUser = await user.matchPassword(email, password);
      const token = setUser(foundUser);
      res.cookie("uid", token, { httpOnly: true });

      return res.redirect(redirectPath);
      // return res.redirect('/');
    } catch (err) {
      console.error("Login error:", err.message);
      res.render("login", {
        error: "Invalid email or password"
      });
    }
  })
  .get("/logout", (req, res) => {
    res.clearCookie("uid", { path: "/" });
    res.send(`
    <script>
      sessionStorage.removeItem('welcomePopupShown');
      window.location.href = "/";
    <\/script>
  `);
  })

  .get("/dashboard", async (req, res) => {
    const token = req.cookies.uid;
    const userData = getUser(token);
    if (!userData) {
      return res.redirect("/user/login");
    }

    try {
      const currentUser = await user.findById(userData._id);

      const posts = await Post.find({ author: currentUser._id })
        .populate('author', 'username profileImageURL')
        .sort({ createdAt: -1 });

      const totalPosts = posts.length;
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
      res.render("dashboard", {
        user: currentUser,
        posts: posts,
        totalPosts,
        totalLikes
      });
    } catch (err) {
      res.redirect("/user/login");
    }
  })

router.get('/profile', async (req, res) => {
  if (!req.user) return res.redirect('/user/login');
  res.render('profile', { user: req.user });
});

router.post('/profile', upload.single('profileImage'), async (req, res) => {
  if (!req.user) return res.redirect('/user/login');
  const { username, email } = req.body;
  let error = null;

  if (email && email !== req.user.email) {
    const existingUser = await user.findOne({ email });
    if (existingUser) {
      error = 'Email is already registered.';
    }
  }

  if (!error) {
    if (username) req.user.username = username;
    if (email && email !== req.user.email) req.user.email = email;
    if (req.file) {
      req.user.profileImageURL = `/images/${req.file.filename}`;
    }
    await req.user.save();
    return res.redirect('/user/dashboard');
  } else {
    return res.render('profile', { user: req.user, error });
  }
});

// Mark all notifications as read
router.post('/notifications/mark-all-read', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  req.user.notifications.forEach(n => n.read = true);
  await req.user.save();
  res.json({ success: true });
});

// Get all notifications (for dropdown or notifications page)
router.get('/notifications', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ notifications: req.user.notifications });
});

module.exports = router;
