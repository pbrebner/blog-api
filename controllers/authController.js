const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

const User = require("../models/user");

// Set up passport to authenticate login
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await User.findOne({ email: username });

            if (!user) {
                return done(null, false, { message: "Incorrect username" });
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                // passwords do not match!
                return done(null, false, { message: "Incorrect password" });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

// Function to verify token
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) {
        return res.sendStatus(401);
    }

    req.token = token;

    // Could also verify for the individual routes and provide info as required
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
};

exports.login = [
    //Authenticate login
    passport.authenticate("local", { session: false }, (err, user, info) => {
        if (err || !user) {
            return res.status(403).json({ info });
        }
    }),
    // Function to create token
    asyncHandler(async (req, res, next) => {
        const user = await User.findOne(
            { username: req.body.username },
            "name username memberStatus adminStatus"
        ).exec();

        // Create Token
        jwt.sign(
            user,
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "12h" }, // Set for 12h as I haven't implemented a way to refresh token
            (err, token) => {
                if (err) {
                    return res
                        .status(401)
                        .json({ message: "Error creating token" });
                }

                res.json({ token });
            }
        );
    }),
];

exports.logout = asyncHandler(async (req, res, next) => {
    // FIGURE OUT HOW TO COMBINE PASSPORT AND JWT TO LOGOUT
    // Might not need
    res.json({ message: "Not Implemented yet" });
});
