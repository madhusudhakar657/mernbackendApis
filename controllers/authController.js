const { signupSchema, signinSchema, acceptCodeSchema, changePasswordSchema, changeForgotPasswordSchema } = require("../middlewares/validator");
const User = require("../models/userModel");
require("dotenv").config();
const jwt = require('jsonwebtoken');
const transport = require('../middlewares/sendMails')
const { doHash, hmacProcess, doHashValidation } = require("../utils/hashing");

exports.signup = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { error, value } = signupSchema.validate({ email, password });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }
        const hashedPassword = await doHash(password, 12);
        const newUser = new User({ email, password: hashedPassword });
        const result = await newUser.save();
        result.password = undefined;
        res.status(201).json({ success: true, message: "Your Account has been created successfully", result })
    } catch (error) {
        console.log(error)
    }
};

exports.signin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { error, value } = signinSchema.validate({ email, password });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const existingUser = await User.findOne({ email }).select('+password');
        if (!existingUser) {
            return res.status(400).json({ message: "Email does not exist" });
        }
        const result = await doHashValidation(password, existingUser.password);
        if (!result) {
            return res.status(400).json({ message: "Invalid User Credentials" });
        }
        const token = jwt.sign({
            userId: existingUser._id,
            email: existingUser.email,
            verified: existingUser.verified
        }, process.env.TOKEN_SECRET);
        res.cookie('Authorization', 'Bearer' + token, {
            expires: new Date(Date.now() + 8 * 3600000),
            httpOnly: process.env.NODE_ENV === "production", secure: process.env.NODE_ENV === "production"
        }).json({
            success: true, message: "You have been logged in successfully", token
        })

    } catch (error) {
        console.log(error);
    }
}

exports.signout = async (req, res) => {
    res.clearCookie('Authorization').status(200).json({ success: true, message: "logged out successfully" })
}

exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        return res.status(404).json({ message: "User does not exist" });
    }
    if (existingUser.verified) {
        return res.status(400).json({ message: "You are already verified" });
    }
    const codeValue = Math.floor(Math.random() * 1000000).toString();
    const info = await transport.sendMail({
        from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        to: existingUser.email,
        subject: "Email Verification code",
        html: '<h2>' + codeValue + '</h2>'
    });
    if (info.accepted[0] === existingUser.email) {
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFY_CODE_SECRET)
        existingUser.verificationCode = hashedCodeValue;
        existingUser.verificationCodeValidation = Date.now();
        await existingUser.save();
        res.status(200).json({ success: true, message: "code Sent!" })
    }
}


exports.verifyVerificationCode = async (req, res) => {
    const { email, providedCode } = req.body;
    try {
        const { error, value } = acceptCodeSchema.validate({ email, providedCode });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({ email }).select("+verificationCode +verificationCodeValidation")


        if (!existingUser) {
            return res.status(400).json({ message: "User does not exist" });
        }
        if (existingUser.verified) {
            return res.status(400).json({ message: "You are already verified" });
        }
        if (!existingUser.verificationCode || !existingUser.verificationCodeValidation) {
            return res.status(400).json({ success: false, message: "Something is wrong with code" });
        }
        if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "Code is expired" });
        }
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFY_CODE_SECRET)
        if (hashedCodeValue === existingUser.verificationCode) {
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            await existingUser.save();
            res.status(200).json({ success: true, message: "Verification successful!" })
        }
        return res.status(400).json({ success: false, message: "Invalid code" })

    } catch (error) {
        console.log(error)

    }

}

exports.changePassword = async (req, res) => {
    const { userId, verified } = req.user;
    const { oldPassword, newPassword } = req.body;
    try {
        const { error, value } = changePasswordSchema.validate({ oldPassword, newPassword });
        const existingUser = await User.findOne({ _id: userId }).select('+password');
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message })
        }
        if (!existingUser.verified) {
            return res.status(401).json({ success: false, message: 'You are not verified user!' })
        }

        if (!existingUser) {
            return res.status(404).json({ success: "user doen't exits!" })
        }
        const result = await doHashValidation(oldPassword, existingUser.password)
        if (!result) {
            return res.status(400).json({ success: false, message: "Invalid old password!" })
        }
        const hashedPassword = await doHash(newPassword, 12);
        existingUser.password = hashedPassword;
        await existingUser.save();
        return res.status(200).json({ success: true, message: "Password has been changed successfully" })
    } catch (error) {
        console.log(error)
    }
}

exports.sendForgotPasswordCode = async (req, res) => {
    const { email } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: "User does not exist" });
        }
        const codeValue = Math.floor(Math.random() * 1000000).toString();
        const info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Forgot Password    code",
            html: '<h2>' + codeValue + '</h2>'
        });
        if (info.accepted[0] === existingUser.email) {
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFY_CODE_SECRET)
            existingUser.forgotPasswordCode = hashedCodeValue;
            existingUser.forgotPasswordCodeValidation = Date.now();
            await existingUser.save();
            res.status(200).json({ success: true, message: "code Sent!" })
        }
        res.status(400).json({ success: false, message: 'Code Sent Failed!' })
    } catch (error) {
        console.log(error)
    }
}

exports.verifyForgotPasswordCode = async (req, res, next) => {
    const { email, providedCode, newPassword } = req.body;
    try {
        const { error, value } = changeForgotPasswordSchema.validate({ email, providedCode,newPassword });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }
        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({ email }).select("+forgotPasswordCode +forgotPasswordCodeValidation")


        if (!existingUser) {
            return res.status(400).json({ message: "User does not exist" });
        }
        if (!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation) {
            return res.status(400).json({ success: false, message: "Something is wrong with code" });
        }
        if (Date.now() - existingUser.forgotPasswordCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "Code is expired" });
        }
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFY_CODE_SECRET)
        if (hashedCodeValue === existingUser.forgotPasswordCode) {
            const hashedPassword = await doHash(newPassword, 12);
            existingUser.password = hashedPassword;
            existingUser.forgotPasswordCode = undefined;
            existingUser.forgotPasswordCodeValidation = undefined;
            await existingUser.save();
            res.status(200).json({ success: true, message: "Password has been updated successful!" })
        }
        return res.status(400).json({ success: false, message: "Invalid code" })

    } catch (error) {
        console.log(error)
    }
}