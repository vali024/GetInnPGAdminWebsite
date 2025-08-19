import mongoose from "mongoose";

// Payment status schema for rental tracking
const paymentStatusSchema = new mongoose.Schema({
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  },
  remindersSent: [{
    type: Date
  }]
});

const memberSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  age: {
    type: Number,
    required: true,
    min: 18
  },
  phoneNumber: {
    type: String,
    required: true,
    match: /^\d{10}$/,
    unique: true
  },
  emailId: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  parentsNumber: {
    type: String,
    required: true,
    match: /^\d{10}$/
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  occupation: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  paymentStatus: {
    type: Map,
    of: paymentStatusSchema,
    default: new Map()
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  roomNumber: {
    type: String,
    required: true,
    trim: true
  },
  floorNumber: {
    type: String,
    required: true,
    trim: true
  },
  roomType: {
    type: String,
    required: true,
    enum: ['single', 'double', 'triple', 'shared'],
    default: 'single'
  }
}, {
  timestamps: true
});

const memberModel = mongoose.models.member || mongoose.model("member", memberSchema);

export default memberModel;
