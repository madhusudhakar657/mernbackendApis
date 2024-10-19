const mongoose = require('mongoose');



const userSchema = mongoose.Schema({
    email: {
        type: String,
        trim: true,
        required: [true, 'Email is Required!'],
        unique: [true, 'Email must be Unique!'],
        minLength: [true, 'Email must have 5 characters'],
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "Password must be Provided!"],
        trim: true,
        select: false
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationCode:{
        type:String,
        select:false
    },
    verificationCodeValidation: {
        type:String,
        select:false
    },
    forgotPasswordCode:{
        type:String,
        select:false
    },
    forgotPasswordCodeValidation:{
        type:Number,
        select:false
    },
},
{
    timestamps:true
}
);

module.exports=mongoose.model('User',userSchema);