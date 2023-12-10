const User = require("../models/user");

const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

exports.getAllUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find({}, "name posts").populate("posts").exec();

    if (!users) {
        res.status(404).json({ error: "No entries found in database" });
    } else {
        res.json(users);
    }
});

exports.createUser = [
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

exports.getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findOne(
        { _id: req.params.userId },
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
