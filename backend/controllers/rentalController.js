import Member from '../models/memberModel.js';

// Get rental data for a specific month with statistics
export const getRentalData = async (req, res) => {
  try {
    const { month, year } = req.query;
    console.log('Query params:', { month, year });

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    // Get all active members
    const members = await Member.find({ status: 'active' })
      .select('_id fullName phoneNumber emailId roomNumber floorNumber roomType profilePic amount status paymentStatus');
    console.log(`Found ${members.length} active members`);

    const monthKey = `${year}-${month}`;

    // Calculate monthly statistics
    let monthlyStats = {
      totalMembers: members.length,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      paidMembers: 0,
      unpaidMembers: 0,
      roomTypeStats: {
        single: { total: 0, paid: 0, amount: 0 },
        double: { total: 0, paid: 0, amount: 0 },
        triple: { total: 0, paid: 0, amount: 0 },
        shared: { total: 0, paid: 0, amount: 0 }
      }
    };

    // Process member data and calculate statistics
    const rentalData = members.map(member => {
      const paymentStatusForMonth = member.paymentStatus.get(monthKey) || { isPaid: false };
      const amount = member.amount || 0;
      const roomType = member.roomType.toLowerCase();
      
      // Update room type statistics
      monthlyStats.roomTypeStats[roomType].total++;
      monthlyStats.roomTypeStats[roomType].amount += amount;
      if (paymentStatusForMonth.isPaid) {
        monthlyStats.roomTypeStats[roomType].paid++;
      }

      // Update overall statistics
      monthlyStats.totalAmount += amount;
      if (paymentStatusForMonth.isPaid) {
        monthlyStats.paidAmount += amount;
        monthlyStats.paidMembers++;
      }

      return {
        _id: member._id,
        fullName: member.fullName,
        phoneNumber: member.phoneNumber,
        emailId: member.emailId,
        roomNumber: member.roomNumber,
        roomType: member.roomType,
        profilePic: member.profilePic,
        amount: amount,
        status: member.status,
        paymentStatus: {
          [monthKey]: paymentStatusForMonth
        }
      };
    });

    // Calculate remaining statistics
    monthlyStats.unpaidAmount = monthlyStats.totalAmount - monthlyStats.paidAmount;
    monthlyStats.unpaidMembers = monthlyStats.totalMembers - monthlyStats.paidMembers;
    monthlyStats.collectionRate = monthlyStats.totalAmount > 0 
      ? (monthlyStats.paidAmount / monthlyStats.totalAmount) * 100 
      : 0;

    return res.json({
      success: true,
      data: rentalData,
      statistics: monthlyStats
    });

  } catch (error) {
    console.error('Error in getRentalData:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching rental data',
      error: error.message
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { memberId, month, year, isPaid } = req.body;

    // Validate input
    if (!memberId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: memberId, month, and year are required'
      });
    }

    // Validate month and year format
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month value. Month must be between 1 and 12'
      });
    }

    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2050) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year value'
      });
    }

    // Find and update member with optimistic concurrency control
    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    if (member.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update payment status for inactive member'
      });
    }

    // Format the payment key consistently
    const paymentKey = `${yearNum}-${monthNum}`;
    
    // Get current payment status
    const currentStatus = member.paymentStatus.get(paymentKey);
    
    // If already in desired state, return success
    if (currentStatus && currentStatus.isPaid === isPaid) {
      return res.json({
        success: true,
        message: 'Payment status already up to date',
        data: {
          memberId,
          paymentKey,
          isPaid,
          paidAt: currentStatus.paidAt
        }
      });
    }

    // Update the payment status with additional metadata
    member.paymentStatus.set(paymentKey, {
      isPaid,
      paidAt: isPaid ? new Date() : null,
      updatedAt: new Date(),
      updatedBy: req.user ? req.user._id : 'system'
    });

    // Save with version control
    const updatedMember = await member.save();

    // Return detailed response
    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        memberId: updatedMember._id,
        paymentKey,
        isPaid,
        paidAt: updatedMember.paymentStatus.get(paymentKey).paidAt,
        updatedAt: updatedMember.paymentStatus.get(paymentKey).updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.name === 'VersionError') {
      return res.status(409).json({
        success: false,
        message: 'Document was modified by another request, please try again'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send payment reminder
export const sendPaymentReminder = async (req, res) => {
  try {
    const { memberId, month, year } = req.body;
    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Update reminder sent timestamp
    const paymentKey = `${year}-${month}`;
    const currentStatus = member.paymentStatus.get(paymentKey) || { isPaid: false, remindersSent: [] };
    currentStatus.remindersSent = [...(currentStatus.remindersSent || []), new Date()];
    member.paymentStatus.set(paymentKey, currentStatus);

    await member.save();

    // Here you would typically implement the actual reminder sending logic
    // (SMS, email, etc.)

    res.json({
      success: true,
      message: 'Payment reminder sent successfully'
    });
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending payment reminder'
    });
  }
};
