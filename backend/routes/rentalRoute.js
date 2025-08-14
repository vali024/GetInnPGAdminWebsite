import express from 'express';
import { getRentalData, updatePaymentStatus, sendPaymentReminder } from '../controllers/rentalController.js';

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log(`[Rental Route] ${req.method} ${req.path}`, {
    query: req.query,
    body: req.body
  });
  next();
});

// Routes
router.get('/rental-data', getRentalData);
router.post('/update-payment', updatePaymentStatus);
router.post('/send-reminder', sendPaymentReminder);

export default router;
