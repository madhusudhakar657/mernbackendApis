const jwt = require('jsonwebtoken');

exports.identifier = (req,res,next)=>{
let token;
if(req.headers.client === 'not-browser'){
    token =req.headers.authorization
}else{
    token=req.cookies['Authorization']
}

if(!token){
    return res.status(401).json({success:false,error:'No token, authorization denied'});
}
try {
    const userToken = token.split(' ')[1];
  
    const jwtVerified = jwt.verify(userToken,process.env.TOKEN_SECRET);
    if(jwtVerified){
        req.user = jwtVerified;
        next()
    }else{
        throw new Error('error in the Token')
    }   
} catch (error) {
   console.log(error) 
}
}