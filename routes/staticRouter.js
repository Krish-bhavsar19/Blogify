const express = require("express");
// const { restrictToLoggedinUserOnly } = require('../middleware/auth');
const { getUser } = require('../service/auth');
const { Post } = require('../Model/post');
const router = express.Router();
const { user } = require('../Model/user');

router.get("/", async (req, res) => {
    try {
        const user = req.cookies?.uid ? await getUser(req.cookies.uid) : null;
        
        return res.render("home", { user, id: null });
    } catch (error) {
        console.error(error);
        return res.render("home", { user: null, id: null });
    }
});

router.get("/signup", (req, res) => {
    const error = req.query.error;
    return res.render("signup", { error });
});

router.get("/login", (req, res) => {
    const error = req.query.error;
    return res.render("login", { error });
});

router.get("/search", async (req, res) => {
    const query = req.query.q || '';
    let posts = [];
    if (query) {
        posts = await Post.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } }
            ]
        }).populate('author', 'username profileImageURL');
    }
    res.render('search', { query, posts });
});

router.get("/", async (req, res) => {
  

  try {
    const token = req.cookies.uid;
    let currentUser = null;

    if (token) {
      const userData = getUser(token); 
      if (userData) {
        currentUser = await user.findById(userData._id); 
      }
    }

    const posts = await Post.find({ isPublished: true })
      .populate("author", "username profileImageURL")
      .sort({ createdAt: -1 })
      .limit(9);


    const categories = {};
    allPosts.forEach((post) => {
      const cat = post.category || "General";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(post);
    });

    res.render("home", {
      user: currentUser,
      posts,
      categories,
    });
  } catch (error) {
    console.error("Home page error:", error);
    res.render("home", { user: null, posts: [], categories: {} });
  }
});


router.get("/allposts", async (req, res) => {

  try {
    const token = req.cookies.uid;
    let currentUser = null;

    if (token) {
      const userData = getUser(token); 
      if (userData) {
        currentUser = await user.findById(userData._id); 
      }
    }


    const allPosts = await Post.find({ isPublished: true })
      .populate("author", "username profileImageURL")
      .sort({ createdAt: -1 })

    const categories = {};
    allPosts.forEach((post) => {
      const cat = post.category || "General";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(post);
    });

    res.render("allposts", {
      user: currentUser,
      posts:allPosts,
      categories,
    });
  } catch (error) {
    console.error("allposts page error:", error);
    res.render("allposts", { user: null, posts: [], categories: {} });
  }
});



module.exports = router;