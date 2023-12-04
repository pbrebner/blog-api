const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const postController = require("../controllers/postController");
const commentController = require("../controllers/commentController");

/* GET home page. */
router.get("/", function (req, res, next) {
    res.send("Not implemented yet");
});

// AUTH ROUTES

router.post("/login", authController.login);

router.post("/signup", authController.signup);

router.post("/logout", authController.logout);

// USER ROUTES

router.get("/users", userController.getAllUsers);

router.get("/users/:userId", userController.getUser);

// POST ROUTES

router.get("/posts", postController.getAllPosts);

router.post("/posts", postController.createPost);

router.get("/posts/:postId", postController.getPost);

router.put("/posts/:postId/update", postController.updatePost);

router.delete("/posts/:postId", postController.deletePost);

// COMMENT ROUTES

router.get("/posts/:postId/comments", commentController.getAllPostComments);

router.post("/posts/:postId/comments".commentController.createPostComment);

module.exports = router;
