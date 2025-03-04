const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // number of login requests per window of time
    message: {
        msg: "Too many login attempts from this IP, please try again after a minute.",
    },
    handler: (req, res, next, options) => {
        // Sends if the limit is reached
        res.status(400).json({
            errors: options.message.msg,
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = loginLimiter;
