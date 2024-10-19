const joi = require('joi');


exports.signupSchema = joi.object({
    email:joi.string().min(6).max(50).required().email({tlds:{allow:['com','net']}}),
    password:joi.string().required().pattern(new RegExp('^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).{8,}$')),
});

exports.signinSchema = joi.object({
    email:joi.string().min(6).max(50).required().email({tlds:{allow:['com','net']}}),
    password:joi.string().required().pattern(new RegExp('^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).{8,}$')),
})

exports.acceptCodeSchema = joi.object({
    email:joi.string().min(6).max(50).required().email({tlds:{allow:['com','net']}}),
    providedCode:joi.number().required()
});

exports.changePasswordSchema = joi.object({
    oldPassword:joi.string().required().pattern(new RegExp('^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).{8,}$')),
    newPassword:joi.string().required().pattern(new RegExp('^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).{8,}$')),

});
exports.changeForgotPasswordSchema = joi.object({
    email:joi.string().min(6).max(50).required().email({tlds:{allow:['com','net']}}),
    providedCode:joi.number().required(),
    newPassword:joi.string().required().pattern(new RegExp('^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).{8,}$')),

});

exports.createPostSchema = joi.object({
    title:joi.string().min(6).max(50).required(),
    description:joi.string().min(6).max(600).required(),
    userId:joi.string().required()      ,

});
