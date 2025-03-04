const jwt = require("jsonwebtoken");

// Function to verify token
const verifyToken = (req, res, next) => {
    const authHeader =
        req.headers["authorization"] || req.headers["Authorization"];

    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid Token." });
        }

        req.token = token;
        req.user = decoded.user;
        next();
    });
};

module.exports = verifyToken;
