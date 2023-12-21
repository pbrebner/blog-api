# blog-api

[Link to Client](https://github.com/pbrebner/blog-client)

## About

REST API backend for a blog website built as part of The ODIN Project curriculum. Routes and controllers were set up with RESTful organization in mind.

## Features

-   RESTful API
-   Routes to get/post/edit/delete users, posts and comments
-   User authorization and permission management with jwt tokens
-   Securing passwords with bcryptjs
-   Schema validation using Mongoose
-   Error handling with status codes passed to frontend

## Technologies Used

-   NodeJS
-   ExpressJS
-   MongoDB
-   Mongoose
-   bcryptjs
-   Passport

## TODO

-   Modify user model to include profile picture and user description
-   Modify user controller to be able to upload picture and description on user update
-   Modify post model to have published attribute
-   Create and implement refresh tokens
