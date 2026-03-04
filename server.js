import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import bookingRouter from "./routes/bokingRoutes.js";



const app = express()

// Database connect
await connectDB()

// Middleware
// ✅ Vercel ke liye sahi CORS claud
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

app.use(cors())

app.use(express.json())

app.get('/' , (req, res) => res.send("server is running"))

// -------- Existing routes --------
app.use('/api/user', userRouter)
app.use('/api/owner', ownerRouter )
app.use('/api/bookings', bookingRouter )


// -------- Image uploading route --------
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`))


