const { Schema, model } = require("mongoose");
const { createHmac, randomBytes } = require("crypto");
const mongoose = require('mongoose');

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  profileImageURL: {
    type: String,
    default: '/images/man-avatar.jpg'
  },
  role: {
    type: String,
    enum: ["User", "Admin"],
    default: "User"
  },
  notifications: [
    {
      type: { type: String, enum: ['like', 'comment'] },
      postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
      fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
      text: String,
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  viewedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
}, { timestamps: true });

userSchema.static("matchPassword", async function(email, password) {
  const user = await this.findOne({ email });
  if (!user) throw new Error("User not found");

  const userProvidedHash = createHmac("sha256", user.salt)
    .update(password)
    .digest("hex");

  if (user.password !== userProvidedHash) {
    throw new Error("Incorrect Password");
  }

  return user;
});

const user = model("user", userSchema);
module.exports ={user};
