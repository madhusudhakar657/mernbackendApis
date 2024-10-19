const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const authRouter = require('./routers/authRouter')
const postsRouter = require('./routers/postsRouter')
const mongoose = require('mongoose');
const PORT = 5000;

const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));


mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log('Connected to MongoDB');
}).catch((error)=>{
    console.error(' Couldnot connect to MonogoDB',error);
});

app.use('/api/auth',authRouter);
app.use('/api/posts',postsRouter);

app.get('/',(req,res)=>{
    console.log('Server is running');
    res.send('Server is running');
})



app.listen(process.env.PORT
    ,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
})

