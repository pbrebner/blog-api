const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");

const { deleteFileS3 } = require("../controllers/s3Controller");

const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

exports.getAllUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find(
        {},
        "name avatar memberStatus timeStamp"
    ).exec();

    res.json({ users: users });
});

exports.createUser = [
    body("name", "Name must be between 1 and 30 characters.")
        .trim()
        .isLength({ min: 1, max: 30 })
        .custom(async (value) => {
            const user = await User.find({ name: value }).exec();
            if (user.length > 0) {
                throw new Error(
                    "Name is already in use, please use a different one."
                );
            }
        })
        .blacklist("<>"),
    body("username")
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage("Username must be between 1 and 50 characters.")
        .isEmail()
        .withMessage("Username is not proper email format.")
        .custom(async (value) => {
            // Check for characters not allowed and throw error if found
            const errorValues = ["<", ">", "&", "'", '"', "/"];
            let error = false;
            errorValues.forEach((errorValue) => {
                if (value.includes(errorValue)) {
                    error = true;
                }
            });

            if (error) {
                throw new Error(
                    "Username can't contain the following values: < > & ' \" /"
                );
            }

            // Check if username is already in use
            const user = await User.find({ username: value }).exec();
            if (user.length > 0) {
                throw new Error(
                    "Username is already in use, please use a different one."
                );
            }
        }),
    body("password", "Password must be a minimum of 6 characters.")
        .trim()
        .isLength({ min: 6 })
        .custom((value) => {
            // Check for characters not allowed and throw error if found
            const errorValues = ["<", ">", "&", "'", '"', "/"];
            let error = false;
            errorValues.forEach((errorValue) => {
                if (value.includes(errorValue)) {
                    error = true;
                }
            });

            if (error) {
                throw new Error(
                    "Password can't contain the following values: < > & ' \" /"
                );
            }
        }),
    body("passwordConfirm", "Passwords must match.")
        .trim()
        .custom((value, { req }) => {
            return value === req.body.password;
        }),
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
                    res.json({
                        message: "User successfully created",
                        userId: user._id,
                    });
                }
            }
        });
    }),
];

exports.getUser = asyncHandler(async (req, res, next) => {
    if (req.user._id === req.params.userId) {
        // Get the user of the supplied access token
        const user = await User.findOne(
            { _id: req.user._id },
            "name username userDescription avatar memberStatus adminStatus posts timeStamp"
        )
            .populate("posts")
            .exec();

        if (!user) {
            // Inform client that not user was found
            res.status(404).json({ error: "User not found" });
        } else {
            // If guest account, sets guest profile as true
            if (user.username == "jimsmith@example.com") {
                res.json({
                    user: user,
                    guestProfile: true,
                    usersProfile: true,
                });
            } else {
                res.json({
                    user: user,
                    guestProfile: false,
                    usersProfile: true,
                });
            }
        }
    } else {
        // Get the other user profile from the parameters
        const user = await User.findOne(
            { _id: req.params.userId },
            "name userDescription avatar memberStatus posts timeStamp"
        )
            .populate({
                path: "posts",
                match: { published: true },
                select: "-user -comments",
            })
            .exec();

        if (!user) {
            // Inform client that not user was found
            res.status(404).json({ error: "User not found" });
        } else {
            res.json({ user: user, guestProfile: false, usersProfile: false });
        }
    }
});

exports.updateUser = [
    body("avatar").optional().trim(),
    body("name", "Name must be between 1 and 30 characters.")
        .trim()
        .isLength({ min: 1, max: 30 })
        .custom(async (value, { req }) => {
            const currentUser = await User.findById(req.user._id).exec();
            const user = await User.find({ name: value }).exec();

            // Check if name is taken by another user
            if (user.length > 0 && currentUser.name != value) {
                throw new Error(
                    "Name is already in use, please use a different one."
                );
            }
        }),
    body("username")
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage("Username must be between 1 and 50 characters.")
        .isEmail()
        .withMessage("Username is not proper email format.")
        .custom(async (value, { req }) => {
            // Check for characters not allowed and throw error if found
            const errorValues = ["<", ">", "&", "'", '"', "/"];
            let error = false;
            errorValues.forEach((errorValue) => {
                if (value.includes(errorValue)) {
                    error = true;
                }
            });

            if (error) {
                throw new Error(
                    "Username can't contain the following values: < > & ' \" /"
                );
            }

            const currentUser = await User.findById(req.user._id).exec();
            const user = await User.find({ username: value }).exec();

            // Check if username is taken by another user
            if (user.length > 0 && currentUser.username != value) {
                throw new Error(
                    "Username is already in use, please use a different one."
                );
            }
        }),
    body(
        "userDescription",
        "User Description must be less than 300 characters."
    )
        .trim()
        .isLength({ max: 300 })
        .blacklist("<>"),
    asyncHandler(async (req, res, next) => {
        //Confirm user is updating their own account
        if (req.user._id == req.params.userId) {
            const errors = validationResult(req);

            const user = await User.findById(req.user._id).exec();

            // Create for use below
            let userUpdateBody = {
                name: req.body.name,
                username: req.body.username,
                userDescription: req.body.userDescription,
            };

            // To ensure that the guest profile username can't be changed
            if (user.username == "jimsmith@example.com") {
                userUpdateBody.username = user.username;
            }

            if (!errors.isEmpty()) {
                res.status(400).json({
                    user: userUpdateBody,
                    errors: errors.array(),
                });
            } else {
                if (req.body.avatar) {
                    userUpdateBody.avatar = req.body.avatar;
                }

                const user = await User.findByIdAndUpdate(
                    req.user._id,
                    userUpdateBody
                ).exec();

                if (!user) {
                    return res.status(404).json({
                        error: `No user with id ${req.user._id} exists`,
                    });
                } else {
                    res.json({
                        message: "User updated successfully.",
                        userId: user._id,
                    });
                }
            }
        } else {
            res.status(401).json({
                error: "Not authorized for this action.",
            });
        }
    }),
];

exports.deleteUser = asyncHandler(async (req, res, next) => {
    //Confirm user is deleting their own account
    if (req.user._id == req.params.userId) {
        const user = await User.findById(req.user._id).exec();

        if (!user) {
            return res
                .status(404)
                .json({ error: `No user with id ${req.user._id} exists` });
        } else if (user.username == "jimsmith@example.com") {
            // This is the guest account and can't be deleted
            return res
                .status(405)
                .json({ error: `Deleting guest account not allowed` });
        } else {
            await User.findByIdAndDelete(req.user._id).exec();

            // If avatar, delete from S3
            if (user.avatar != process.env.AVATAR_DEFAULT_URL) {
                const filename = user.avatar.split("/").pop();

                await deleteFileS3(filename);
            }

            const posts = await Post.deleteMany({ user: req.user._id }).exec();

            // If the posts have images, delete from S3
            posts.forEach(async (post) => {
                if (post.image) {
                    const filename = post.image.split("/").pop();

                    await deleteFileS3(filename);
                }
            });

            await Comment.deleteMany({
                user: req.user._id,
            }).exec();

            res.json({
                message: "User deleted successfully.",
                userId: user._id,
            });
        }
    } else {
        res.status(401).json({ error: "Not authorized for this action." });
    }
});
