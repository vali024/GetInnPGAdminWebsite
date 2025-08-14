import memberModel from "../models/memberModel.js";
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Get room occupancy
export const getRoomOccupancy = async (req, res) => {
    try {
        // Get all active members
        const members = await memberModel.find({ status: 'active' });
        
        // Create occupancy map with room type information
        const occupancy = {};
        members.forEach(member => {
            if (!occupancy[member.roomNumber]) {
                occupancy[member.roomNumber] = {
                    count: 0,
                    roomType: member.roomType,
                    members: []
                };
            }
            occupancy[member.roomNumber].count++;
            occupancy[member.roomNumber].members.push({
                id: member._id,
                name: member.fullName
            });
        });

        res.status(200).json({
            success: true,
            occupancy
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching room occupancy",
            error: error.message
        });
    }
};

const addMember = async (req, res) => {
    try {
        const { 
            fullName,
            gender,
            age,
            phoneNumber,
            emailId,
            occupation,
            amount,
            status = 'active',
            roomNumber,
            floorNumber,
            roomType = 'single'
        } = req.body;

        // Validate room details
        if (!roomNumber?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide room number"
            });
        }

        if (!floorNumber?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide floor number"
            });
        }

        // Check room occupancy and type
        const existingOccupants = await memberModel.find({ 
            roomNumber, 
            status: 'active'
        });
        
        // Get room capacity based on room type
        const getRoomCapacity = (type) => {
            switch (type) {
                case 'single': return 1;
                case 'double': return 2;
                case 'triple': return 3;
                case 'shared': return 4;
                default: return 1;
            }
        };

        if (existingOccupants.length > 0) {
            // Check if room type matches
            const existingRoomType = existingOccupants[0].roomType;
            if (existingRoomType !== roomType) {
                return res.status(400).json({
                    success: false,
                    message: `This room is already occupied as ${existingRoomType} sharing`
                });
            }

            // Check if room has capacity
            const capacity = getRoomCapacity(roomType);
            if (existingOccupants.length >= capacity) {
                return res.status(400).json({
                    success: false,
                    message: `Room is at full capacity for ${roomType} sharing`
                });
            }
        }

        // Enhanced input validation
        if (!fullName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide full name"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a profile picture"
            });
        }

        // Validate phone number format
        if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid 10-digit phone number"
            });
        }

        // Validate email format
        if (!emailId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        // Check for duplicate phone number
        const existingPhone = await memberModel.findOne({ phoneNumber });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: "A member with this phone number already exists"
            });
        }

        // Check for duplicate email
        const existingEmail = await memberModel.findOne({ emailId });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "A member with this email address already exists"
            });
        }

        const member = new memberModel({
            fullName,
            gender,
            age: Number(age),
            phoneNumber,
            emailId,
            occupation,
            amount: Number(amount),
            profilePic: req.file.filename,
            status,
            roomNumber,
            floorNumber,
            roomType
        });

        await member.save();

        return res.status(201).json({
            success: true,
            message: "Member added successfully",
            data: member
        });

    } catch (error) {
        console.error('Error adding member:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while adding member"
        });
    }
};

const listMembers = async (req, res) => {
    try {
        const members = await memberModel.find({})
            .select('-__v')
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            data: members
        });

    } catch (error) {
        console.error('Error listing members:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching members list"
        });
    }
};

const deleteMember = async (req, res) => {
    try {
        const { id } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid member ID"
            });
        }

        const member = await memberModel.findById(id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        // Delete profile picture
        try {
            const imagePath = path.join(__dirname, '../uploads', member.profilePic);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        } catch (error) {
            console.error('Error deleting profile picture:', error);
        }

        await memberModel.findByIdAndDelete(id);

        return res.json({
            success: true,
            message: "Member deleted successfully"
        });

    } catch (error) {
        console.error('Error deleting member:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while deleting member"
        });
    }
};

const updateMember = async (req, res) => {
    try {
        const { id } = req.body;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid member ID"
            });
        }

        const member = await memberModel.findById(id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        // Handle profile picture update
        if (req.file) {
            try {
                const oldImagePath = path.join(__dirname, '../uploads', member.profilePic);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
                updates.profilePic = req.file.filename;
            } catch (error) {
                console.error('Error handling profile picture update:', error);
            }
        }

        // Check for duplicate phone number and email if they're being updated
        if (updates.phoneNumber && updates.phoneNumber !== member.phoneNumber) {
            const existingPhone = await memberModel.findOne({ phoneNumber: updates.phoneNumber });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: "A member with this phone number already exists"
                });
            }
        }

        if (updates.emailId && updates.emailId !== member.emailId) {
            const existingEmail = await memberModel.findOne({ emailId: updates.emailId });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: "A member with this email address already exists"
                });
            }
        }

        const updatedMember = await memberModel.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        return res.json({
            success: true,
            message: "Member updated successfully",
            data: updatedMember
        });

    } catch (error) {
        console.error('Error updating member:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while updating member"
        });
    }
};

export { addMember, listMembers, deleteMember, updateMember };
