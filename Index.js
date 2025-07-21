require('dotenv').config();

const { connectmongo } = require("./connection");
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const userRoutes = require("./routes/user");
const postRoutes = require("./routes/post");
const cookieParser=require('cookie-parser');
const { checkAuth } = require("./middleware/auth");
const staticRouter=require("./routes/staticRouter");
const app = express();

const { user } = require('./Model/user');
const { Post } = require('./Model/post');
const { getUser } = require('./service/auth');

const PORT = process.env.PORT || 8000;

const passport = require('passport');
require('./config/passport');

const authGoogleRoutes = require('./routes/authgoogle');
app.use('/auth', authGoogleRoutes);

app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.set("trust proxy", true);
app.set("view engine", "ejs");
app.set("views", path.resolve("./view"));
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use(cookieParser());
app.use(checkAuth);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.get("/", async (req, res) => {
  try {
    const token = req.cookies.uid;
    const userData = getUser(token);
    let currentUser = null;
    
    if (userData) {
      currentUser = await user.findById(userData._id);
    }
    
    const posts = await Post.find({ isPublished: true })
      .populate('author', 'username profileImageURL')
      .sort({ createdAt: -1 })
      .limit(6);

    const allPosts = await Post.find({ isPublished: true })
      .populate('author', 'username profileImageURL')
      .sort({ createdAt: -1 });
    const categories = {};
    allPosts.forEach(post => {
      const cat = post.category || 'General';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(post);
    });
    
    res.render("home", { 
      user: currentUser,
      posts: posts,
      categories: categories
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.render("home", { user: null, posts: [], categories: {} });
  }
});
app.use("/user", userRoutes);
app.use("/posts", postRoutes);
app.use("/",staticRouter);

connectmongo(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Atlas connected");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });

