const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const postController = require("../controllers/postController");
const commentController = require("../controllers/commentController");

/* GET home page. */
router.get("/", function (req, res, next) {
    res.send("API");
});

// AUTH ROUTES

router.post("/login", authController.login);

router.post("/logout", authController.logout);

// USER ROUTES

router.get("/users", userController.getAllUsers);

router.post("/users", userController.createUser);

router.get(
    "/users/:userId",
    authController.verifyToken,
    userController.getUser
);

router.put(
    "/users/:userId",
    authController.verifyToken,
    userController.updateUser
);

router.delete(
    "/users/:userId",
    authController.verifyToken,
    userController.deleteUser
);

// POST ROUTES

router.get("/posts", postController.getAllPosts);

router.post("/posts", authController.verifyToken, postController.createPost);

router.get("/posts/:postId", postController.getPost);

router.put(
    "/posts/:postId",
    authController.verifyToken,
    postController.updatePost
);

router.delete(
    "/posts/:postId",
    authController.verifyToken,
    postController.deletePost
);

// COMMENT ROUTES

router.get("/posts/:postId/comments", commentController.getAllPostComments);

router.post(
    "/posts/:postId/comments",
    authController.verifyToken,
    commentController.createPostComment
);

router.delete(
    "/posts/:postId/comments/commentId",
    authController.verifyToken,
    commentController.deleteComment
);

module.exports = router;
