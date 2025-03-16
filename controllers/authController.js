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
                return done(null, false, {
                    message: "Incorrect username or password.",
                });
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                // passwords do not match!
                return done(null, false, {
                    message: "Incorrect password or password.",
                });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

exports.refresh = (req, res, next) => {
    if (req.cookies?.jwt) {
        // Destructuring refreshToken from cookie
        const refreshToken = req.cookies.jwt;

        // Verifying refresh token
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            asyncHandler(async (err, decoded) => {
                if (err) {
                    // Wrong Refesh Token
                    return res.status(403).json({ message: "Invalid Token." });
                }

                const user = await User.findById(
                    decoded.user._id,
                    "name email memberStatus adminStatus"
                ).exec();
                if (!user) {
                    return res.status(401).json({ message: "Unauthorized." });
                }

                // Correct token we send a new access token
                const token = jwt.sign(
                    { user: user },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: "20m" }
                );

                return res.json({ token: token });
            })
        );
    } else {
        return res.status(401).json({ message: "Unauthorized." });
    }
};

exports.login = (req, res) => {
    passport.authenticate(
        "local",
        { session: false },
        async (err, user, options) => {
            if (!user) {
                // Credentials are wrong, respond with error message
                console.log(options.message); // Prints the reason of the failure
                res.status(400).json({ errors: options.message });
            } else {
                // Credentials are correct
                console.log("User Authenticated.");

                const user = await User.findOne(
                    { username: req.body.username },
                    "name username memberStatus adminStatus"
                ).exec();

                // Create Token
                const token = jwt.sign(
                    { user: user },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: "20m" }
                );

                // Create Refresh Token
                const refreshToken = jwt.sign(
                    { user: user },
                    process.env.REFRESH_TOKEN_SECRET,
                    { expiresIn: "7d" }
                );

                // Assigning refresh token in http-only cookie
                res.cookie("jwt", refreshToken, {
                    httpOnly: true, // accessible only from web server
                    sameSite: "None",
                    secure: false, // https
                    maxAge: 7 * 24 * 60 * 60 * 1000, // Needs to match refresh expire
                });

                res.json({ body: user, token: token });
            }
        }
    )(req, res);
};

exports.logout = asyncHandler(async (req, res, next) => {
    if (req.cookies?.jwt) {
        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: "None",
            secure: false,
        });
        return res.json({ message: "Logout Successful" });
    } else {
        return res.sendStatus(204);
    }
});
