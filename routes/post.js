const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Post } = require('../Model/post');
const { user } = require('../Model/user');
const { getUser } = require('../service/auth');
const moment = require('moment');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({ storage, fileFilter });

const requireauth = async (req, res, next) => {
  const token = req.cookies.uid;
  const userData = getUser(token);

  if (!userData) {
    return res.redirect("/user/login");
  }

  const loggedInUser = await user.findById(userData._id);
  if (!loggedInUser) {
    return res.redirect("/user/login");
  }

  req.user = loggedInUser;
  res.locals.user = {
    _id: loggedInUser._id,
    username: loggedInUser.username,
    email: loggedInUser.email,
    role: loggedInUser.role,
    profileImageURL: loggedInUser.profileImageURL
  };
  next();
};
router
  .post('/create', requireauth, upload.single('image'), async (req, res) => {
    try {
      const { title, content, category, tags } = req.body;
      const authorId = req.user._id;

      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      const imagePath = req.file ? `/images/${req.file.filename}` : '/images/default-post.jpg';
      const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

      const newPost = new Post({
        title,
        content,
        author: authorId,
        image: imagePath,
        category: category || 'General',
        tags: tagArray
      });

      await newPost.save();

      res.redirect('/user/dashboard');
    } catch (error) {
      console.error('Post creation error:', error);
      res.status(500).json({ error: "Failed to create post" });
    }
  })

  // Like/Dislike a post
  .post('/:id/like', requireauth, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user._id;
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      const liked = post.likes.includes(userId);
      if (liked) {
        post.likes = post.likes.filter(id => id.toString() !== userId.toString());
      } else {
        post.likes.push(userId);
        if (post.author.toString() !== userId.toString()) {
          const postAuthor = await user.findById(post.author);
          postAuthor.notifications.push({
            type: 'like',
            postId: post._id,
            fromUser: userId,
            text: `${req.user.username} liked your post.`,
            read: false
          });
          await postAuthor.save();
        }
      }
      await post.save();


      res.json({ likes: post.likes.length });
    } catch (error) {
      console.error('Like/Dislike error:', error);
      res.status(500).json({ error: 'Failed to like/dislike post' });
    }
  })

  // Edit post form
  .get('/:id/edit', requireauth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post || post.author.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }
    res.render('editPost', { post });
  })

  // Update post
  .post('/:id/edit', requireauth, upload.single('image'), async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post || post.author.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }
    const { title, content, category, tags } = req.body;
    post.title = title;
    post.content = content;
    post.category = category;
    post.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];
    if (req.file) {
      post.image = `/images/${req.file.filename}`;
    }
    await post.save();
    res.redirect('/user/dashboard');
  })

  // Delete post
  .post('/:id/delete', requireauth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post || post.author.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }
    await Post.deleteOne({ _id: req.params.id });
    res.redirect('/user/dashboard');
  })

  //read More
  .get('/:id', requireauth, async (req, res) => {
    let post = await Post.findById(req.params.id).populate('author');
    if (!post) {
      return res.status(404).send('Post not found');
    }
    const commentAuthors = await user.find({ _id: { $in: post.comments.map(c => c.author) } });
    const authorMap = {};
    commentAuthors.forEach(u => {
      authorMap[u._id.toString()] = { username: u.username, profileImageURL: u.profileImageURL };
    });
    post = post.toObject();
    post.likes = post.likes ? post.likes.map(id => id.toString()) : [];
    post.comments = post.comments.map(comment => {
      return {
        ...comment,
        author: authorMap[comment.author?.toString()] || null
      };
    });
    res.render('readPost', { post, user: req.user });
  })

// Add a comment to a post
router.post('/:id/comments', requireauth, async (req, res) => {
  try {
    const postId = req.params.id;
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty.' });
    }
    const userId = req.user._id;
    const userName = req.user.username;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    post.comments.push({ text: comment, author: userId, authorName: userName });
    await post.save();
    if (post.author.toString() !== userId.toString()) {
      const postAuthor = await user.findById(post.author);
      postAuthor.notifications.push({
        type: 'comment',
        postId: post._id,
        fromUser: userId,
        text: `${userName} commented on your post.`,
        read: false
      });
      await postAuthor.save();
    }


    res.redirect('/posts/' + postId);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

router.get('/post/:id', async (req, res) => {
  try {
    let post = await Post.findById(req.params.id).populate('author');
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    const commentAuthors = await user.find({ _id: { $in: post.comments.map(c => c.author) } });
    const authorMap = {};
    commentAuthors.forEach(u => {
      authorMap[u._id.toString()] = { username: u.username, profileImageURL: u.profileImageURL };
    });
    post = post.toObject();
    post.comments = post.comments.map(comment => {
      return {
        ...comment,
        author: authorMap[comment.author?.toString()] || null
      };
    });
    res.render('readPost', { post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post.' });
  }
});

//search
router.get("/search", async (req, res) => {
  const query = req.query.q?.trim();
  if (!query) return res.redirect("/");

  try {
    const matchingAuthors = await User.find({
      name: { $regex: query, $options: "i" }
    });

    const authorIds = matchingAuthors.map(user => user._id);

    const posts = await Post.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { author: { $in: authorIds } }
      ]
    }).populate("author");

    res.render("search-results", { posts, query });

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).send("Server Error");
  }
});


//category
router.get('/category/:categoryName', async (req, res) => {
  try {
    const categoryName = req.params.categoryName;
    const posts = await Post.find({ category: categoryName }).populate("author");
    res.render('category', { posts, categoryName });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});
//all Posts

router.get("/allpost", async (req, res) => {
  console.log("this is feature route");

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
      .limit(6);

    const allPosts = await Post.find({ isPublished: true })
      .populate("author", "username profileImageURL")
      .sort({ createdAt: -1 });

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



module.exports = router;