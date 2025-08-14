import { useState, useEffect } from 'react';
import './RentalData.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSpinner, FaBell, FaCheck, FaWhatsapp } from 'react-icons/fa';

const RentalData = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'paid', 'unpaid'
  const [filterRoomType, setFilterRoomType] = useState('all');
  const [filterFloorNumber, setFilterFloorNumber] = useState('all');

  const url = "https://getinnpgbackend.onrender.com";
  const defaultImage = 'https://via.placeholder.com/100x100?text=No+Image';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data for:', {
        month: currentMonth + 1,
        year: currentYear
      });

      const response = await axios.get(`${url}/api/rental/rental-data`, {
        params: {
          month: currentMonth + 1,
          year: currentYear
        }
      });
      
      console.log('Response:', response.data);
      
      if (response.data && response.data.success) {
        setMembers(response.data.data || []);
      } else {
        throw new Error(response.data?.message || "Failed to fetch rental data");
      }
    } catch (error) {
      console.error("Error fetching rental data:", error);
      setError(error.message || "Error loading rental data");
      toast.error(error.message || "Error loading rental data");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentUpdate = async (memberId, isPaid) => {
    // Find the member we're updating
    const memberToUpdate = members.find(m => m._id === memberId);
    if (!memberToUpdate) {
      toast.error("Member not found");
      return;
    }

    const monthKey = `${currentYear}-${currentMonth + 1}`;
    const currentPaymentStatus = memberToUpdate.paymentStatus?.[monthKey]?.isPaid;

    // If status is already what we want, don't make the request
    if (currentPaymentStatus === isPaid) {
      toast.info(isPaid ? "Payment already marked as paid" : "Payment already marked as unpaid");
      return;
    }

    try {
      // Show loading state for this specific card
      setMembers(prevMembers => prevMembers.map(member => 
        member._id === memberId 
          ? { ...member, isUpdating: true }
          : member
      ));

      const response = await axios.post(`${url}/api/rental/update-payment`, {
        memberId,
        month: currentMonth + 1,
        year: currentYear,
        isPaid
      });

      if (response.data.success) {
        // Update the local state with the server response data
        setMembers(prevMembers => prevMembers.map(member => {
          if (member._id === memberId) {
            return {
              ...member,
              isUpdating: false,
              paymentStatus: {
                ...member.paymentStatus,
                [monthKey]: {
                  isPaid,
                  paidAt: response.data.data.paidAt,
                  updatedAt: response.data.data.updatedAt
                }
              }
            };
          }
          return member;
        }));

        toast.success(response.data.message || "Payment status updated successfully");

        // If marking as paid, automatically send WhatsApp confirmation
        if (isPaid) {
          handleWhatsAppMessage(
            memberToUpdate.phoneNumber,
            true,
            memberToUpdate.amount,
            memberToUpdate.fullName
          );
        }
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      
      // Reset the updating state
      setMembers(prevMembers => prevMembers.map(member => 
        member._id === memberId 
          ? { ...member, isUpdating: false }
          : member
      ));

      // Show specific error message
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || "Error updating payment status";
      
      toast.error(errorMessage);

      // If it's a network error, show a different message
      if (!error.response) {
        toast.error("Network error. Please check your connection and try again.");
      }
    }
  };

  const sendPaymentReminder = async (memberId) => {
    try {
      const response = await axios.post(`${url}/api/rental/send-reminder`, {
        memberId,
        month: currentMonth + 1,
        year: currentYear
      });

      if (response.data.success) {
        toast.success("Payment reminder sent successfully");
      } else {
        toast.error(response.data.message || "Failed to send reminder");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("Error sending reminder");
    }
  };

  const handleWhatsAppMessage = (phoneNumber, isPaid, amount, name) => {
    const month = months[currentMonth];
    const message = isPaid 
      ? `🏢 *Get Inn Luxury Co-Living*\n\n`+
        `Dear ${name},\n\n`+
        `We confirm receipt of your rent payment:\n`+
        `• Amount: Rs.${amount}\n`+
        `• Month: ${month} ${currentYear}\n`+
        `• Status: ✅ Paid\n\n`+
        `Thank you for choosing Get Inn Luxury Co-Living.\n\n`+
        `Best regards,\n`+
        `Get Inn Management Team`
      : `🏢 *Get Inn Luxury Co-Living*\n\n`+
        `Dear ${name},\n\n`+
        `This is a gentle reminder regarding your pending rent payment:\n`+
        `• Amount Due: Rs.${amount}\n`+
        `• Month: ${month} ${currentYear}\n`+
        `• Status: ⏳ Pending\n\n`+
        `Please arrange the payment at your earliest convenience.\n\n`+
        `If you have any concerns, feel free to contact us.\n\n`+
        `Best regards,\n`+
        `Get Inn Management Team`;
      
    // Format phone number (remove any non-digit characters and ensure it starts with 91)
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    const whatsappNumber = formattedPhone.startsWith('91') ? formattedPhone : `91${formattedPhone}`;
    
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Change month
  const handleMonthChange = (increment) => {
    let newMonth = currentMonth + increment;
    let newYear = currentYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phoneNumber.includes(searchQuery) ||
      member.roomNumber.toString().includes(searchQuery);

    const matchesStatus = filterStatus === 'all' ? true :
      filterStatus === 'paid' 
        ? member.paymentStatus?.[`${currentYear}-${currentMonth + 1}`]?.isPaid 
        : !member.paymentStatus?.[`${currentYear}-${currentMonth + 1}`]?.isPaid;


    const matchesRoomType = filterRoomType === 'all' ? true :
      member.roomType.toLowerCase() === filterRoomType;

    const matchesFloor = filterFloorNumber === 'all' ? true :
      (member.floorNumber === filterFloorNumber || 
       (filterFloorNumber === 'G' && member.roomNumber.startsWith('G')) ||
       member.roomNumber.charAt(0) === filterFloorNumber);

    return matchesSearch && matchesStatus && matchesRoomType && matchesFloor;
  });

  useEffect(() => {
    fetchMembers();
  }, [currentMonth, currentYear]);

  if (loading) {
    return (
      <div className="rental-data loading-state">
        <p>Loading rental data...</p>
        <div className="loading-spinner">
          <FaSpinner className="spinner-icon" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rental-data error-state">
        <p>Error: {error}</p>
        <button onClick={fetchMembers} className="retry-btn">
          Retry Loading
        </button>
      </div>
    );
  }

  // Calculate monthly statistics
  const calculateMonthlyStats = () => {
    const monthKey = `${currentYear}-${currentMonth + 1}`;
    const totalMembers = members.length;
    const paidMembers = members.filter(member => member.paymentStatus?.[monthKey]?.isPaid).length;
    const unpaidMembers = totalMembers - paidMembers;
    const totalAmount = members.reduce((sum, member) => sum + (member.amount || 0), 0);
    const paidAmount = members
      .filter(member => member.paymentStatus?.[monthKey]?.isPaid)
      .reduce((sum, member) => sum + (member.amount || 0), 0);
    const unpaidAmount = totalAmount - paidAmount;

    return {
      totalMembers,
      paidMembers,
      unpaidMembers,
      totalAmount,
      paidAmount,
      unpaidAmount
    };
  };

  const monthlyStats = calculateMonthlyStats();

  return (
    <div className="rental-data">
      <div className="rental-header">
        <div className="header-top">
          <div className="month-selector">
            <button onClick={() => handleMonthChange(-1)}>&lt;</button>
            <h2>{months[currentMonth]} {currentYear}</h2>
            <button onClick={() => handleMonthChange(1)}>&gt;</button>
          </div>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by name, phone, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="monthly-stats">
          <div className="stat-card total">
            <h3>Total Collection</h3>
            <div className="amount">₹{monthlyStats.totalAmount.toLocaleString()}</div>
            <div className="sub-text">{monthlyStats.totalMembers} Members</div>
          </div>
          <div className="stat-card paid">
            <h3>Amount Paid</h3>
            <div className="amount">₹{monthlyStats.paidAmount.toLocaleString()}</div>
            <div className="sub-text">{monthlyStats.paidMembers} Members</div>
          </div>
          <div className="stat-card unpaid">
            <h3>Amount Due</h3>
            <div className="amount">₹{monthlyStats.unpaidAmount.toLocaleString()}</div>
            <div className="sub-text">{monthlyStats.unpaidMembers} Members</div>
          </div>
          <div className="stat-card progress">
            <h3>Collection Progress</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${monthlyStats.totalAmount > 0 
                    ? (monthlyStats.paidAmount / monthlyStats.totalAmount) * 100 
                    : 0}%` 
                }}
              ></div>
            </div>
            <div className="sub-text">
              {monthlyStats.totalAmount > 0 
                ? Math.round((monthlyStats.paidAmount / monthlyStats.totalAmount) * 100) 
                : 0}% Collected
            </div>
          </div>
        </div>
        <div className="header-filters">
          <div className="filter-group">
            <label>Payment Status:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Floor Number:</label>
            <select value={filterFloorNumber} onChange={(e) => setFilterFloorNumber(e.target.value)}>
              <option value="all">All Floors</option>
              <option value="G">Ground Floor</option>
              <option value="1">Floor 1</option>
              <option value="2">Floor 2</option>
              <option value="3">Floor 3</option>
              <option value="4">Floor 4</option>
              <option value="5">Floor 5</option>
              <option value="6">Floor 6</option>
              <option value="7">Floor 7</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Room Type:</label>
            <select value={filterRoomType} onChange={(e) => setFilterRoomType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rental-cards">
        {filteredMembers.map((member) => (
          <div 
            key={member._id} 
            className={`rental-card ${member.paymentStatus?.[`${currentYear}-${currentMonth + 1}`]?.isPaid ? 'paid' : 'unpaid'}`}
          >
            <div className="card-header">
              <div className="member-profile">
                <img 
                  src={member.profilePic ? `${url}/uploads/${member.profilePic}` : defaultImage}
                  alt={member.fullName}
                  onError={(e) => { e.target.src = defaultImage; }}
                />
              </div>
              <div className="member-info">
                <h3>{member.fullName}</h3>
                <p className="room-info">
                  Room {member.roomNumber} • {member.roomType.charAt(0).toUpperCase() + member.roomType.slice(1)} • 
                  {member.floorNumber ? ` Floor ${member.floorNumber}` : 
                   member.roomNumber.startsWith('G') ? ' Ground Floor' :
                   ` Floor ${member.roomNumber.charAt(0)}`}
                </p>
              </div>
            </div>
            
            <div className="card-content">
              <div className="contact-info">
                <p><strong>Phone:</strong> {member.phoneNumber}</p>
                <p><strong>Amount:</strong> ₹{member.amount || 0}</p>
              </div>
              
              <div className="payment-badge">
                {member.paymentStatus?.[`${currentYear}-${currentMonth + 1}`]?.isPaid ? (
                  <span className="paid-badge">Paid</span>
                ) : (
                  <span className="unpaid-badge">Unpaid</span>
                )}
              </div>
            </div>

            <div className="card-actions">
              <button 
                className={`action-btn ${member.paymentStatus?.[`${currentYear}-${currentMonth + 1}`]?.isPaid ? 'paid-btn' : 'mark-paid-btn'}`}
                onClick={() => {
                  if (!member.paymentStatus?.[`${currentYear}-${currentMonth + 1}`]?.isPaid) {
                    handlePaymentUpdate(member._id, true);
                  } else {
                    handleWhatsAppMessage(member.phoneNumber, true, member.amount, member.fullName);
                  }
                }}
                disabled={member.isUpdating}
              >
                {member.isUpdating ? (
                  <><FaSpinner className="spinner-icon" /> Updating...</>
                ) : member.paymentStatus?.[`${currentYear}-${currentMonth + 1}`]?.isPaid ? (
                  <><FaWhatsapp /> Send Receipt</>
                ) : (
                  <><FaCheck /> Mark as Paid</>
                )}
              </button>
              <button 
                className="remind-btn"
                onClick={() => {
                  sendPaymentReminder(member._id);
                  handleWhatsAppMessage(member.phoneNumber, false, member.amount, member.fullName);
                }}
              >
                <FaBell /> Notify
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RentalData;
