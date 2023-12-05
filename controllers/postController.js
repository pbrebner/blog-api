const Post = require("../models/post");

const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.getAllPosts = asyncHandler(async (req, res, next) => {
    const posts = await Post.find()
        .sort({ timeStamp: 1 })
        .limit(10) // Limit to 10 for now
        .exec();

    if (!posts) {
        res.status(404).json({ error: "No entries found in database" });
    } else {
        res.json(posts);
    }
});

exports.createPost = [
    body("title", "Posts must include a title")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("content", "Post must have some content")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("published").escape(),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        const post = new Post({
            title: req.body.title,
            content: req.body.content,
            published: req.body.published,
        });

        if (!errors.isEmpty()) {
            // Inform client post had errors
            res.status(400).json({
                post: post,
                errors: errors.array(),
            });
            return;
        } else {
            await post.save();
            // Inform client post was saved
            res.json({ message: "Post successfully saved" });
        }
    }),
];

exports.getPost = asyncHandler(async (req, res, next) => {
    const post = Post.findOne({ _id: req.params.postId })
        .populate("comments")
        .exec();

    if (!post) {
        // Inform client that not post was found
        res.status(404).json({ error: "Post not found" });
    } else {
        res.json(post);
    }
});

exports.updatePost = asyncHandler(async (req, res, next) => {
    // Update with body title, text, and/or published
    // const post = Post.findByIdAndUpdate(req.params.postId);

    res.json({ message: "Not Implemented yet" });
});

exports.deletePost = asyncHandler(async (req, res, next) => {
    //const post = Post.findByIdAndDelete(req.params.postId);

    res.json({ message: "Not Implemented yet" });
});
