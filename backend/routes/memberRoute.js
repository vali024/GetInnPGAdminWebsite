import express from "express";
import { addMember, listMembers, deleteMember, updateMember, getRoomOccupancy } from "../controllers/memberController.js";

const memberRouter = express.Router();

memberRouter.post("/add", addMember);
memberRouter.get("/list", listMembers);
memberRouter.post("/delete", deleteMember);
memberRouter.post("/update", updateMember);
memberRouter.get("/room-occupancy", getRoomOccupancy);

export default memberRouter;
