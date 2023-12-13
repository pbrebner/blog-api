const Post = require("../models/post");
const Comment = require("../models/comment");

const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.getAllPosts = asyncHandler(async (req, res, next) => {
    const posts = await Post.find()
        .populate("user")
        .sort({ timeStamp: 1 })
        .limit(10) // Limit to 10 for now
        .exec();

    if (!posts) {
        res.status(404).json({ error: "No entries found in database" });
    } else {
        res.json(posts);
    }
});

// TODO: Add way to save and/or publish the article
exports.createPost = [
    body("title", "Posts must include a title")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("content", "Post must contain some content")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        const post = new Post({
            title: req.body.title,
            content: req.body.content,
            user: req.user._id,
            published: true,
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
    const post = await Post.findOne({ _id: req.params.postId })
        .populate("comments")
        .exec();

    if (!post) {
        // Inform client that not post was found
        res.status(404).json({ error: "Post not found" });
    } else {
        res.json(post);
    }
});

exports.updatePost = [
    body("title", "Posts must include a title")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("content", "Post must contain some content")
        .trim()
        .isLength({ min: 1 })
        .escape(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // Inform client post had errors
            res.status(400).json({
                post: { title: req.body.title, content: req.body.content },
                errors: errors.array(),
            });
            return;
        } else {
            const post = await Post.findByIdAndUpdate(req.params.postId, {
                title: req.body.title,
                content: req.body.content,
            });

            if (!post) {
                return res
                    .status(404)
                    .json({
                        error: `No post with id ${req.params.postId} exists`,
                    });
            } else {
                res.json({ message: "Post updated successfully", post: post });
            }
        }
    }),
];

exports.deletePost = asyncHandler(async (req, res, next) => {
    const post = await Post.findByIdAndDelete(req.params.postId);

    if (!post) {
        return res
            .status(404)
            .json({ error: `No post with id ${req.params.postId} exists` });
    } else {
        const comment = await Comment.deleteMany({ postId: req.params.postId });
        res.json({ message: "Post deleted successfully", post: post });
    }
});
