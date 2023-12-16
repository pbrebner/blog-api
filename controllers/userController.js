const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");

const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

exports.getAllUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find(
        {},
        "name memberStatus timeStamp timeStampFormatted"
    ).exec();

    if (!users) {
        res.status(404).json({ error: "No entries found in database" });
    } else {
        res.json(users);
    }
});

exports.createUser = [
    body("name", "Name must not be between 1 and 40 characters")
        .trim()
        .isLength({ min: 1, max: 40 })
        .custom(async (value) => {
            const user = await User.find({ name: value }).exec();
            if (user.length > 0) {
                throw new Error(
                    "Name is already in use, please use a different one"
                );
            }
        })
        .escape(),
    body("username", "Username must not be empty")
        .trim()
        .isLength({ min: 1 })
        .isEmail()
        .withMessage("Username is not proper email format")
        .custom(async (value) => {
            const user = await User.find({ username: value }).exec();
            if (user.length > 0) {
                throw new Error(
                    "Username is already in use, please use a different one"
                );
            }
        })
        .escape(),
    body("password", "Password must not be a minimum of 6 characters")
        .trim()
        .isLength({ min: 6 })
        .escape(),
    body("passwordConfirm", "Passwords must match")
        .trim()
        .custom((value, { req }) => {
            return value === req.body.password;
        })
        .escape(),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
            if (err) {
                return next(err);
            } else {
                //Create User object with data
                const user = new User({
                    name: req.body.name,
                    username: req.body.username,
                    password: hashedPassword,
                    memberStatus: true,
                });

                if (!errors.isEmpty()) {
                    res.status(400).json({
                        user: { name: user.name, username: user.username },
                        errors: errors.array(),
                    });
                } else {
                    await user.save();
                    res.json({ message: "User successfully created" });
                }
            }
        });
    }),
];

// TODO: Set this up to return different information depending if the data is the users
exports.getUser = asyncHandler(async (req, res, next) => {
    // Get the user of the supplied access token
    const user = await User.findOne(
        { _id: req.user._id },
        "name username memberStatus adminStatus posts timeStamp"
    )
        .populate("posts")
        .exec();

    if (!user) {
        // Inform client that not user was found
        res.status(404).json({ error: "User not found" });
    } else {
        res.json(user);
    }
});

// TODO: Check that the param user matches the id supplied by the token
exports.updateUser = [
    body("name", "Name must not be between 1 and 20 characters")
        .trim()
        .isLength({ min: 1, max: 20 })
        .custom(async (value) => {
            const user = await User.find({ name: value }).exec();
            if (user.length > 0) {
                throw new Error(
                    "Name is already in use, please use a different one"
                );
            }
        })
        .escape(),
    body("username", "Username must not be empty")
        .trim()
        .isLength({ min: 1 })
        .isEmail()
        .withMessage("Username is not proper email format")
        .custom(async (value) => {
            const user = await User.find({ username: value }).exec();
            if (user.length > 0) {
                throw new Error(
                    "Username is already in use, please use a different one"
                );
            }
        })
        .escape(),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({
                user: { name: req.body.name, username: req.body.username },
                errors: errors.array(),
            });
        } else {
            const user = await User.findByIdAndUpdate(req.user._id, {
                name: req.body.name,
                username: req.body.username,
            });

            if (!user) {
                return res
                    .status(404)
                    .json({ error: `No user with id ${req.user._id} exists` });
            } else {
                res.json({
                    message: "User updated successfully",
                    user: req.body.name,
                });
            }
        }
    }),
];

exports.deleteUser = asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.user._id);

    if (!user) {
        return res
            .status(404)
            .json({ error: `No user with id ${req.user._id} exists` });
    } else {
        const posts = await Post.deleteMany({ user: req.user._id });
        const comments = await Comment.deleteMany({ user: req.user._id });
        res.json({
            message: "User deleted successfully",
            user: user.name,
            posts: posts,
            comments: comments,
        });
    }
});
