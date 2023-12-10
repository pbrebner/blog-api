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
    body("content", "Comment has to be between 1 and 140 characters")
        .trim()
        .isLength({ min: 1, max: 140 })
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
                content: req.body.content,
                errors: errors.array(),
            });
            return;
        } else {
            await comment.save();
            await Post.findByIdAndUpdate(req.params.postId, {
                $push: { comments: comment },
            });
            res.json({ message: "Comment saved successfully" });
        }
    }),
];

exports.deleteComment = asyncHandler(async (req, res, next) => {
    const comment = await Comment.findByIdAndDelete(req.params.commentId);

    if (!comment) {
        return res.status(404).json({
            error: `No comment with id ${req.params.commentId} exists`,
        });
    } else {
        res.json({ message: "Comment deleted successfully", comment: comment });
    }
});
