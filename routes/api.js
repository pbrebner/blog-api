const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const s3Controller = require("../controllers/s3Controller");
const userController = require("../controllers/userController");
const postController = require("../controllers/postController");
const commentController = require("../controllers/commentController");

const loginLimiter = require("../middleware/loginLimiter");
const verifyToken = require("../middleware/verifyToken");

/* GET home page. */
router.get("/", function (req, res, next) {
    res.send("API");
});

// AUTH ROUTES

router.post("/login", loginLimiter, authController.login);

router.get("/refresh", authController.refresh);

router.post("/logout", authController.logout);

// S3 ROUTES

router.get("/s3Url", verifyToken, s3Controller.getUrl);

// USER ROUTES

router.get("/users", verifyToken, userController.getAllUsers);

router.post("/users", userController.createUser);

router.get("/users/:userId", verifyToken, userController.getUser);

router.put("/users/:userId", verifyToken, userController.updateUser);

router.delete("/users/:userId", verifyToken, userController.deleteUser);

// POST ROUTES

router.get("/posts", postController.getAllPosts);

router.post("/posts", verifyToken, postController.createPost);

router.get("/posts/:postId", verifyToken, postController.getPost);

router.put("/posts/:postId", verifyToken, postController.updatePost);

router.delete("/posts/:postId", verifyToken, postController.deletePost);

// COMMENT ROUTES

router.get(
    "/posts/:postId/comments",
    verifyToken,
    commentController.getAllPostComments
);

router.post(
    "/posts/:postId/comments",
    verifyToken,
    commentController.createPostComment
);

router.put(
    "/posts/:postId/comments/:commentId",
    verifyToken,
    commentController.updateComment
);

router.delete(
    "/posts/:postId/comments/:commentId",
    verifyToken,
    commentController.deleteComment
);

module.exports = router;
