const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.getAllPosts = asyncHandler(async (req, res, next) => {
    const posts = await Post.find(
        { published: true },
        "title content image user timeStamp"
    )
        .populate("user", { name: 1, avatar: 1 })
        .sort({ timeStamp: -1 })
        .limit(20) // Limit to 20 for now
        .exec();

    res.json(posts);
});

exports.createPost = [
    body("title", "Posts must include a title.")
        .trim()
        .isLength({ min: 1 })
        .blacklist("<>"),
    body("content", "Post must contain some content.")
        .trim()
        .isLength({ min: 1 })
        .blacklist("<>"),
    body("image").optional().trim(),
    body("published"),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        const post = new Post({
            title: req.body.title,
            content: req.body.content,
            image: req.body.image || "",
            user: req.user._id,
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
            //Add post to user
            await User.findByIdAndUpdate(req.user._id, {
                $push: { posts: post },
            }).exec();
            // Inform client post was saved
            res.json({ postId: post._id, message: "Post successfully saved." });
        }
    }),
];

exports.getPost = asyncHandler(async (req, res, next) => {
    const post = await Post.findOne({ _id: req.params.postId })
        .populate("user", { name: 1, avatar: 1, timeStamp: 1 })
        .exec();

    if (!post) {
        // Inform client that not post was found
        res.status(404).json({ error: "Post not found" });
    } else {
        res.json(post);
    }
});

exports.updatePost = [
    body("title", "Posts must include a title.")
        .optional()
        .trim()
        .isLength({ min: 1 })
        .blacklist("<>"),
    body("content", "Post must contain some content.")
        .optional()
        .trim()
        .isLength({ min: 1 })
        .blacklist("<>"),
    body("image").optional().trim(),
    body("likes").optional(),
    body("published").optional(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        const post = await Post.findOne({ _id: req.params.postId }, "user")
            .populate("user", { name: 1 })
            .exec();

        if (!post) {
            return res.status(404).json({
                error: `No post with id ${req.params.postId} exists.`,
            });
        }

        if (req.body.title && req.body.content && req.body.published) {
            if (post.user._id == req.user._id) {
                if (!errors.isEmpty()) {
                    // Inform client post had errors
                    res.status(400).json({
                        post: {
                            title: req.body.title,
                            content: req.body.content,
                        },
                        errors: errors.array(),
                    });
                    return;
                } else {
                    if (req.body.image) {
                        const post = await Post.findByIdAndUpdate(
                            req.params.postId,
                            {
                                title: req.body.title,
                                content: req.body.content,
                                image: req.body.image,
                                published: req.body.published,
                            }
                        ).exec();

                        res.json({
                            message: "Post updated successfully.",
                            post: post,
                        });
                    } else {
                        const post = await Post.findByIdAndUpdate(
                            req.params.postId,
                            {
                                title: req.body.title,
                                content: req.body.content,
                                published: req.body.published,
                            }
                        ).exec();

                        res.json({
                            message: "Post updated successfully.",
                            post: post,
                        });
                    }
                }
            } else {
                res.status(403).json({
                    error: "Not authorized for this action.",
                });
            }
        }

        if (req.body.likes) {
            const post = await Post.findByIdAndUpdate(req.params.postId, {
                likes: req.body.likes,
            }).exec();

            res.json({
                message: "Post likes updated successfully.",
            });
        }
    }),
];

exports.deletePost = asyncHandler(async (req, res, next) => {
    const post = await Post.findOne({ _id: req.params.postId }, "user")
        .populate("user", { name: 1 })
        .exec();

    if (!post) {
        return res
            .status(404)
            .json({ error: `No post with id ${req.params.postId} exists` });
    }

    if (post.user._id == req.user._id) {
        const post = await Post.findByIdAndDelete(req.params.postId);
        await Comment.deleteMany({
            postId: req.params.postId,
        }).exec();
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { posts: req.params.postId },
        }).exec();
        res.json({ message: "Post deleted successfully", post: post });
    } else {
        res.status(403).json({
            error: "Not authorized for this action.",
        });
    }
});
