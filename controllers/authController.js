const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const asyncHandler = require("express-async-handler");

const User = require("../models/user");

// Set up passport to authenticate login
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await User.findOne({ username: username });

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
        return res.status(401).json({ message: "No token" });
    }

    req.token = token;

    // Could also verify for the individual routes and provide info as required
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid Token" });
        }

        req.user = user;
        next();
    });
};

exports.login = [
    //TODO: Need to figure out a way to display the error messages during login auth

    //Authenticate login
    passport.authenticate("local", {
        session: false,
    }),

    // Function to create token
    asyncHandler(async (req, res, next) => {
        const user = await User.findOne(
            { username: req.body.username },
            "name username memberStatus adminStatus"
        ).exec();

        /*
        // Create Token
        jwt.sign(
            { user: user },
            process.env.ACCESS_TOKEN_SECRET,
            (err, token) => {
                if (Object.keys(err).length > 0) {
                    return res
                        .status(401)
                        .json({ message: "Error creating token", error: err });
                }

                res.json({ token: token });
            }
        );
        */

        // Create Token
        const token = jwt.sign({ user: user }, process.env.ACCESS_TOKEN_SECRET);
        res.json({ token: token });
    }),
];

exports.logout = asyncHandler(async (req, res, next) => {
    // FIGURE OUT HOW TO COMBINE PASSPORT AND JWT TO LOGOUT
    // Might not need
    res.json({ message: "Not Implemented yet" });
});
