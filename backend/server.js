import 'dotenv/config.js'
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import memberRouter from "./routes/memberRoute.js";
import rentalRouter from "./routes/rentalRoute.js";


const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error('Error: Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

//app config
const app = express()
const port = process.env.PORT || 4000

// middleware 
app.use(express.json())
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
}))

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'))

//DB connection
connectDB().catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});

//api endpoints
app.use('/images', express.static('uploads'))
app.use("/api/member", memberRouter)
app.use("/api/rental", rentalRouter) 

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong! Please try again later.'
    });
});

app.get("/", (req, res) => {
    res.send("API Working")
})

app.listen(port, () => {
    console.log(`server started on http://localhost:${port}`)
})

