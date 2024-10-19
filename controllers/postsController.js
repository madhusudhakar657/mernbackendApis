const { createPostSchema } = require("../middlewares/validator");
const Post = require('../models/postsModel')


exports.getAllPosts = async (req, res) => {
    const { page, limit } = req.params;
    try {
        const result = await Post.find().sort({createdAt:-1}).skip((page-1)*limit).limit(limit).populate({path:'userId',select:'email'});
        res.status(200).json({success:true,message:"posts",data:result,total:result?.length});
   } catch (error) {
        console.log(error)
    }

}

exports.getCreatePost = async (req,res)=>{
    const {userId} = req.user;
    const {title,description} = req.body;

    try {
        const {error,value} = createPostSchema.validate({title,description,userId})
        if (error) {
            return res.status(400).json({success:false,message:error.details[0].message})
        }
        await Post.create({title,description,userId});
        res.status(201).json({success:true,message:"post has been created successfully!"});
   } catch (error) {
        console.log(error)
    }
}

exports.getUpdatePost = async (req,res)=>{
    const {_id} = req.query;
    const {userId} = req.user;
    const {title,description} = req.body;

    try {
        const {error,value} = createPostSchema.validate({title,description,userId})
        if (error) {
            return res.status(400).json({success:false,message:error.details[0].message})
        }
        console.log(_id);
        
        const existingPost = await Post.findOne({_id});
        console.log(existingPost)
        if(!existingPost){
            return res.status(403).json({success:false,message:"Post not Available"})
        }
        if(existingPost.userId.toString() !== userId){
            return res.status(403).json({success:false,message:"You are not authorized to update this Post"});
        }
        existingPost.title = title;
        existingPost.description = description;
        await existingPost.save()
        res.status(201).json({success:true,message:"post has been updated successfully!"});
   } catch (error) {
        console.log(error)
    }
}

exports.getDeletePost = async (req,res)=>{
    const {_id} = req.query;
    const {userId} = req.user;
    
    try {
        const existingPost = await Post.findOne({_id});
        console.log(existingPost)
        if(!existingPost){
            return res.status(403).json({success:false,message:"Post not Available"})
        }
        if(existingPost?.userId.toString() !== userId){
            return res.status(403).json({success:false,message:"You are not authorized to delete this Post"});
        }

        await Post.deleteOne({_id});
        res.status(201).json({success:true,message:"post has been deleted successfully!"});
   } catch (error) {
        console.log(error)
    }
}