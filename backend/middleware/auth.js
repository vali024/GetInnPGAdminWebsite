import jwt from "jsonwebtoken"

const authMiddleware = async (req, res, next) => {
    const { token } = req.headers;
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not Authorized. Please login again."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId; // Fix: Use decoded.userId instead of decoded.id
        next();
    } catch (error) {
        console.error("Auth error:", error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please login again."
        });
    }
}

export default authMiddleware;