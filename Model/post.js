const { Schema, model } = require("mongoose");

const postScema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  image: {
    type: String,
    default: '/images/default-post.jpg'
  },
  category: {
    type: String,
    enum: ["Technology", "Lifestyle", "Travel", "Food","General"],
    default: 'General',
    require:true
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: "user"
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  views: { type: Number, default: 0 },
  comments: [
    {
      text: { type: String, required: true },
      author: { type: Schema.Types.ObjectId, ref: 'user', required: true },
      authorName: { type: String },
      createdAt: { type: Date, default: Date.now },
    }
  ]
}, { timestamps: true });


const Post = model("post", postScema);
module.exports = { Post };
