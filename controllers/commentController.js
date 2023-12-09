const Comment = require("../models/comment");
const Post = require("../models/post");

const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.getAllPostComments = asyncHandler(async (req, res, next) => {
    const comments = await Comment.find({ postId: req.params.postId })
        .populate("user", { name: 1 })
        .exec();

    if (!comments) {
        res.status(404).json({ error: "No entries found in database" });
    } else {
        res.json(comments);
    }
});

exports.createPostComment = [
    body("content", "Comment cannot be empty")
        .trim()
        .isLength({ min: 1, max: 80 })
        .escape(),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        const comment = new Comment({
            content: req.body.content,
            user: req.user._id,
            postId: req.params.postId,
        });

        if (!errors.isEmpty()) {
            res.status(400).json({
                comment: req.body.content,
                errors: errors.array(),
            });
            return;
        } else {
            await Post.findByIdAndUpdate(req.params.postId, {
                $push: { comments: comment },
            });
            await comment.save();
            res.json({ message: "Comment saved successfully" });
        }
    }),
];
