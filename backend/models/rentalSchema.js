import mongoose from 'mongoose';
const { Schema } = mongoose;

const paymentStatusSchema = new Schema({
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

// Update your existing member schema to include paymentStatus
const memberSchema = new Schema({
  // ... your existing fields ...
  paymentStatus: {
    type: Map,
    of: paymentStatusSchema,
    default: new Map()
  }
}, { timestamps: true });
