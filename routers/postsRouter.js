const express = require("express");
const router = express.Router();
const postsController = require('../controllers/postsController')
const { identifier } = require("../middlewares/identification");


router.get('/all-posts',identifier,postsController.getAllPosts);
// router.get('/single-post',identifier,postsController.signin);
router.post('/create-post',identifier,postsController.getCreatePost);
router.put('/update-post',identifier,postsController.getUpdatePost);
router.delete('/delete-post',identifier,postsController.getDeletePost)


module.exports = router;