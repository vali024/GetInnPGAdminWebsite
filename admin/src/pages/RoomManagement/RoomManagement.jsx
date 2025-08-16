import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RoomManagement.css';
import { FaBed, FaUser, FaDoorOpen, FaBuilding, FaSpinner, FaDownload } from 'react-icons/fa';
import { toast } from "react-toastify";
import { CSVLink } from "react-csv";

// Room structure from AddMember component
const roomStructure = {
  G: ["G1", "G2", "G3", "G4"],
  1: ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110"],
  2: ["201", "202", "203", "204", "205", "206", "207", "208", "209", "210"],
  3: ["301", "302", "303", "304", "305", "306", "307", "308", "309", "310"],
  4: ["401", "402", "403", "404", "405", "406", "407", "408", "409", "410"],
  5: ["501", "502", "503", "504", "505", "506", "507", "508", "509", "510"],
  6: ["601", "602", "603", "604", "605", "606", "607", "608", "609", "610"],
  7: ["701", "702"],
};

const RoomManagement = () => {
  const [roomsData, setRoomsData] = useState({});
  const [floorData, setFloorData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedOccupancy, setSelectedOccupancy] = useState('all');

  const url = import.meta.env.VITE_BACKEND_URL;

  // Define room configurations with proper casing to match the database
  const roomConfig = {
    'single': 1,
    'double': 2,
    'triple': 3,
    'shared': 4
  };

// Helper function to get available beds
const getAvailableBeds = (roomType, occupiedCount) => {
  const totalBeds = roomConfig[roomType] || 0;
  return totalBeds - occupiedCount;
};

// Helper function to organize rooms by floor
const organizeRoomsByFloor = (occupancy) => {
  const floorMap = {};
  
  Object.entries(occupancy).forEach(([roomNumber, data]) => {
    const floor = Math.floor(roomNumber / 100);
    if (!floorMap[floor]) {
      floorMap[floor] = {
        rooms: [],
        totalBeds: 0,
        availableBeds: 0
      };
    }
    
    const totalBeds = roomConfig[data.roomType] || 0;
    const availableBeds = getAvailableBeds(data.roomType, data.count);
    
    floorMap[floor].rooms.push({
      roomNumber,
      ...data,
      availableBeds,
      totalBeds
    });
    
    floorMap[floor].totalBeds += totalBeds;
    floorMap[floor].availableBeds += availableBeds;
  });
  
  return floorMap;
};

const fetchRoomData = async () => {
  try {
    setLoading(true);
    setError(null);
    const response = await axios.get(`${url}/api/member/room-occupancy`);

    if (response.data && response.data.success) {
      setRoomsData(response.data.occupancy || {});
      setFloorData(organizeRoomsByFloor(response.data.occupancy || {}));
    } else {
      throw new Error(response.data?.message || "Failed to fetch room data");
    }
  } catch (error) {
    console.error("Error fetching room data:", error);
    setError(error.message || "Error loading room data");
    toast.error(error.message || "Error loading room data");
    setRoomsData({});
    setFloorData({});
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchRoomData();
}, []);

  if (loading) {
    return (
      <div className="rm-container">
        <div className="rm-loading-state">
          <FaSpinner className="rm-spinner-icon" />
          <p>Loading room data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rm-container">
        <div className="rm-error-state">
          <p>Error: {error}</p>
          <button onClick={fetchRoomData} className="rm-retry-btn">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const prepareCSVData = () => {
    const csvData = [];
    csvData.push(['Floor', 'Room Number', 'Room Type', 'Capacity', 'Occupied', 'Available Beds', 'Members']);
    
    Object.entries(roomStructure).forEach(([floor, rooms]) => {
      rooms.forEach(roomNumber => {
        const occupancy = roomsData[roomNumber];
        const maxCapacity = occupancy ? roomConfig[occupancy.roomType] : 1;
        const occupied = occupancy ? occupancy.count : 0;
        const roomType = occupancy ? occupancy.roomType : 'Empty';
        const availableBeds = maxCapacity - occupied;
        const members = occupancy?.members?.map(m => m.name).join(', ') || 'None';
        
        csvData.push([
          floor === 'G' ? 'Ground Floor' : `${floor}th Floor`,
          roomNumber,
          roomType,
          maxCapacity,
          occupied,
          availableBeds,
          members
        ]);
      });
    });
    
    return csvData;
  };

  return (
    <div className="rm-container">
      <div className="rm-header">
        <div className="header-top">
          <div className="rm-title">
            <h2>Room Management</h2>
          </div>

          {/* Search and Filters */}
          <div className="rm-filters-container">
            <div className="rm-filter-group">
              <label>Floor:</label>
              <select 
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="rm-filter-select"
              >
                <option value="all">All Floors</option>
                <option value="G">Ground Floor</option>
                {Object.keys(roomStructure)
                  .filter(floor => floor !== 'G')
                  .map(floor => (
                    <option key={floor} value={floor}>
                      {floor}th Floor
                    </option>
                ))}
              </select>
            </div>

            <div className="rm-filter-group">
              <label>Status:</label>
              <select 
                value={selectedOccupancy}
                onChange={(e) => setSelectedOccupancy(e.target.value)}
                className="rm-filter-select"
              >
                <option value="all">All Rooms</option>
                <option value="filled">Filled</option>
                <option value="available">Available</option>
              </select>
            </div>

            <CSVLink 
              data={prepareCSVData()}
              filename="room-occupancy-report.csv"
              className="rm-download-btn"
            >
              <FaDownload /> Download Report
            </CSVLink>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="rm-stats-grid">
          <div className="rm-stat-card">
            <div className="rm-stat-icon">
              <FaDoorOpen />
            </div>
            <div className="rm-stat-info">
              <h4>Total Rooms</h4>
              <p>{Object.values(roomStructure).reduce((total, rooms) => total + rooms.length, 0)}</p>
              <span>In Building</span>
            </div>
          </div>
          <div className="rm-stat-card">
            <div className="rm-stat-icon">
              <FaUser />
            </div>
            <div className="rm-stat-info">
              <h4>Filled Rooms</h4>
              <p>
                {Object.entries(roomsData).filter(([_, data]) => 
                  data.count >= (roomConfig[data.roomType])
                ).length}
              </p>
              <span>Occupied</span>
            </div>
          </div>
          <div className="rm-stat-card">
            <div className="rm-stat-icon">
              <FaBed />
            </div>
            <div className="rm-stat-info">
              <h4>Available Rooms</h4>
              <p>
                {Object.values(roomStructure).reduce((total, rooms) => total + rooms.length, 0) - 
                  Object.entries(roomsData).filter(([_, data]) => 
                    data.count >= (roomConfig[data.roomType])
                  ).length}
              </p>
              <span>Ready to Occupy</span>
            </div>
          </div>
        </div>
      </div>

      {Object.entries(roomStructure)
        .filter(([floor]) => selectedFloor === 'all' || floor === selectedFloor)
        .map(([floor, rooms]) => (
        <div key={floor} className="rm-floor-section">
          <div className="rm-floor-header">
            <div className="rm-floor-title">
              <FaBuilding className="rm-floor-icon" />
              <h3>{floor === 'G' ? 'Ground Floor' : `${floor}th Floor`}</h3>
            </div>
            <div className="rm-floor-stats">
              <span>Total: {rooms.length}</span>
              <span>Filled: {rooms.filter(room => roomsData[room]?.count >= (roomConfig[roomsData[room]?.roomType])).length}</span>
              <span>Available: {rooms.filter(room => !roomsData[room] || roomsData[room]?.count < (roomConfig[roomsData[room]?.roomType])).length}</span>
            </div>
          </div>
          <div className="rm-rooms-grid">
            {rooms
              .filter(roomNumber => {
                const occupancy = roomsData[roomNumber];
                const maxCapacity = occupancy ? roomConfig[occupancy.roomType] : 1;
                const isFilled = occupancy && occupancy.count >= maxCapacity;
                if (selectedOccupancy === 'filled') return isFilled;
                if (selectedOccupancy === 'available') return !isFilled;
                return true;
              })
              .map(roomNumber => {
                const occupancy = roomsData[roomNumber];
                const maxCapacity = occupancy ? roomConfig[occupancy.roomType] : 1;
                const isFilled = occupancy && occupancy.count >= maxCapacity;
                
                return (
                  <div key={roomNumber} className={`rm-room-card ${isFilled ? 'filled' : ''}`}>
                    <div className="rm-room-header">
                      <h4>Room {roomNumber}</h4>
                      <span className={`rm-status ${isFilled ? 'filled' : 'vacant'}`}>
                        {isFilled ? 'Filled' : 'Vacant'}
                      </span>
                    </div>
                    <div className="rm-room-details">
                      {occupancy ? (
                        <>
                          <div className="rm-detail-item">
                            <FaBed /> 
                            <span>{occupancy.roomType.charAt(0).toUpperCase() + occupancy.roomType.slice(1)} Room</span>
                          </div>
                          <div className="rm-detail-item">
                            <FaUser /> 
                            <span>{occupancy.count}/{maxCapacity} Occupied</span>
                          </div>
                          {occupancy.count < maxCapacity && (
                            <div className="rm-detail-item">
                              <FaBed />
                              <span>{maxCapacity - occupancy.count} {maxCapacity - occupancy.count === 1 ? 'Bed' : 'Beds'} Available</span>
                            </div>
                          )}
                          {occupancy.members && occupancy.members.length > 0 && (
                            <div className="rm-members">
                              <strong>Members:</strong>
                              <div className="rm-member-tags">
                                {occupancy.members.map(m => (
                                  <span key={m.name} className="rm-member-tag">{m.name}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="rm-detail-item">
                            <FaBed /> 
                            <span>Empty Room</span>
                          </div>
                          <div className="rm-detail-item">
                            <span className="available-status">Available for Booking</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoomManagement;