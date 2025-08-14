import express from "express";
import { addMember, listMembers, deleteMember, updateMember, getRoomOccupancy } from "../controllers/memberController.js";
import multer from "multer";

const memberRouter = express.Router();

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "uploads/")
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function(req, file, cb) {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

memberRouter.post("/add", upload.single("profilePic"), addMember);
memberRouter.get("/list", listMembers);
memberRouter.post("/delete", deleteMember);
memberRouter.post("/update", upload.single("profilePic"), updateMember);
memberRouter.get("/room-occupancy", getRoomOccupancy);

export default memberRouter;
