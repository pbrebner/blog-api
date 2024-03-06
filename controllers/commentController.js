const Comment = require("../models/comment");
const Post = require("../models/post");

const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.getAllPostComments = asyncHandler(async (req, res, next) => {
    const comments = await Comment.find(
        { postId: req.params.postId },
        "content user likes timeStamp"
    )
        .populate("user", { name: 1, avatar: 1 })
        .sort({ timeStamp: 1 })
        .exec();

    res.json(comments);
});

exports.createPostComment = [
    body("content", "Comment has to be between 1 and 140 characters.")
        .trim()
        .isLength({ min: 1, max: 140 })
        .blacklist("<>"),
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
            //Add comment to post
            await Post.findByIdAndUpdate(req.params.postId, {
                $push: { comments: comment },
            }).exec();
            res.json({
                commentId: comment._id,
                message: "Comment saved successfully.",
            });
        }
    }),
];

exports.updateComment = [
    body("likes").optional(),

    asyncHandler(async (req, res, next) => {
        const comment = await Comment.findByIdAndUpdate(req.params.commentId, {
            likes: req.body.likes,
        }).exec();

        if (!comment) {
            return res.status(404).json({
                error: `No comment with id ${req.params.commentId} exists.`,
            });
        } else {
            res.json({
                message: "Comment likes updated successfully.",
            });
        }
    }),
];

exports.deleteComment = asyncHandler(async (req, res, next) => {
    const comment = await Comment.findOne({ _id: req.params.commentId }, "user")
        .populate("user", { name: 1 })
        .exec();

    if (!comment) {
        return res.status(404).json({
            error: `No comment with id ${req.params.commentId} exists.`,
        });
    }

    if (comment.user._id == req.user._id) {
        const comment = await Comment.findByIdAndDelete(
            req.params.commentId
        ).exec();
        await Post.findByIdAndUpdate(req.params.postId, {
            $pull: { comments: comment._id },
        }).exec();

        res.json({
            message: "Comment deleted successfully.",
            comment: comment,
        });
    } else {
        res.status(403).json({ error: "Not authorized for this action." });
    }
});
