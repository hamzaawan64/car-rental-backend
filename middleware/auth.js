
import jwt from 'jsonwebtoken'
import User from '../models/User.js';
export  const protect = async(req, res, next) => {
    try{
     let token = req.headers.authorization;
    if(!token){
        return res.json({success: false, message: "Unauthorized"})
    }
    token = token.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = await User.findById(decoded.id).select("-password")

        
    if(!req.user){
            return res.json({success: false, message: "Unauthorized"})
        }
        next()
         
        

    }
    catch(error){
        res.json({
            success:false,
            message: "not authorized"
        })

    }
}

export const isAdmin = async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.json({ success: false, message: "Admin access required" })
  }
  next()
}