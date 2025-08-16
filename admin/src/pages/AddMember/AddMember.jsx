import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./AddMember.css";
import upload_area from "../../assets/upload_area.png";

const url = import.meta.env.VITE_BACKEND_URL;

const AddMember = () => {
  const [data, setData] = useState({
    fullName: "",
    gender: "",
    age: "",
    phoneNumber: "",
    emailId: "",
    parentsNumber: "",
    address: "",
    occupation: "",
    amount: "",
    status: "active",
    roomNumber: "",
    floorNumber: "",
    roomType: "single",
  });

  // Room type options
  const roomTypes = ["single", "double", "triple", "shared"];
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

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomOccupancy, setRoomOccupancy] = useState({});
  const [filteredRooms, setFilteredRooms] = useState([]);

  // Fetch room occupancy data
  const fetchRoomOccupancy = async () => {
    try {
      const response = await axios.get(`${url}/api/member/room-occupancy`);
      if (response.data.success) {
        setRoomOccupancy(response.data.occupancy);
        console.log("Room occupancy updated:", response.data.occupancy);
      }
    } catch (error) {
      console.error("Error fetching room occupancy:", error);
    }
  };

  useEffect(() => {
    fetchRoomOccupancy();

    // Listen for room occupancy changes from MembersList
    const handleOccupancyChange = () => {
      fetchRoomOccupancy();
    };

    window.addEventListener("roomOccupancyChanged", handleOccupancyChange);
    return () => {
      window.removeEventListener("roomOccupancyChanged", handleOccupancyChange);
    };
  }, []);

  const getRoomCapacity = (roomType) => {
    switch (roomType) {
      case "single":
        return 1;
      case "double":
        return 2;
      case "triple":
        return 3;
      case "shared":
        return 4;
      default:
        return 1;
    }
  };

  const isRoomAvailable = (roomNumber, newRoomType) => {
    const room = roomOccupancy[roomNumber];
    if (!room) return true; // Room is empty

    // If room is occupied, check if it matches the room type and has capacity
    const capacity = getRoomCapacity(newRoomType);
    if (room.roomType && room.roomType !== newRoomType) {
      return false; // Cannot mix different room types
    }
    return room.count < capacity;
  };

  // Update available rooms when floor, room type, or occupancy changes
  useEffect(() => {
    if (data.floorNumber) {
      const allRoomsForFloor = roomStructure[data.floorNumber] || [];
      const available = allRoomsForFloor.filter((room) => {
        const roomInfo = roomOccupancy[room];
        // If room is empty, it's available for any type
        if (!roomInfo) return true;

        // If room is occupied, it must match the selected room type and have capacity
        const capacity = getRoomCapacity(data.roomType);
        // Room is available if:
        // 1. It's currently empty (no roomType set) OR
        // 2. It matches the selected type AND has space
        return (
          (!roomInfo.roomType || roomInfo.roomType === data.roomType) &&
          roomInfo.count < capacity
        );
      });
      setFilteredRooms(available);

      // If current room is not in available rooms, reset room selection
      if (data.roomNumber && !available.includes(data.roomNumber)) {
        setData((prev) => ({ ...prev, roomNumber: "" }));
      }
    } else {
      setFilteredRooms([]);
    }
  }, [data.floorNumber, data.roomType, roomOccupancy]);

  const inputHandler = (e) => {
    const { name, value } = e.target;

    if (name === "floorNumber") {
      setData((prev) => ({
        ...prev,
        [name]: value,
        roomNumber: "", // Reset room number when floor changes
      }));
      setAvailableRooms(roomStructure[value] || []);
    } else if (name === "roomNumber") {
      const floor = getFloorFromRoom(value);
      // Check if room is occupied and set room type accordingly
      const roomInfo = roomOccupancy[value];
      if (
        roomInfo &&
        roomInfo.roomType &&
        roomInfo.roomType !== data.roomType
      ) {
        // If room is occupied and has a different type, update room type to match
        setData((prev) => ({
          ...prev,
          [name]: value,
          floorNumber: floor,
          roomType: roomInfo.roomType,
        }));
        toast.info(`Room ${value} is set for ${roomInfo.roomType} sharing`);
      } else {
        setData((prev) => ({
          ...prev,
          [name]: value,
          floorNumber: floor,
        }));
      }
    } else if (name === "roomType") {
      if (data.roomNumber) {
        const roomInfo = roomOccupancy[data.roomNumber];
        if (roomInfo && roomInfo.roomType && roomInfo.roomType !== value) {
          // If room already has a different type, show error
          toast.error(
            `Room ${data.roomNumber} is already set for ${roomInfo.roomType} sharing`
          );
          return;
        }
      }
      setData((prev) => ({ ...prev, [name]: value }));
    } else {
      setData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateImage = (file) => {
    setImageError("");

    if (!file) {
      setImageError("Please select an image");
      return false;
    }

    if (!file.type.startsWith("image/")) {
      setImageError("Please upload a valid image file");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size should be less than 5MB");
      return false;
    }

    return true;
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (validateImage(file)) {
      setImage(file);
    } else {
      toast.error(imageError);
    }
  };

  const imageHandler = (e) => {
    const file = e.target.files[0];
    if (validateImage(file)) {
      setImage(file);
    } else {
      toast.error(imageError);
    }
  };

  const validateForm = () => {
    setImageError("");

    if (!image) {
      setImageError("Please upload a profile picture");
      return false;
    }

    if (!data.fullName.trim()) {
      toast.error("Please enter full name");
      return false;
    }

    // Check room availability
    if (!isRoomAvailable(data.roomNumber, data.roomType)) {
      toast.error(
        `Room ${data.roomNumber} cannot accommodate more members for ${data.roomType} sharing`
      );
      return false;
    }

    if (!data.gender) {
      toast.error("Please select gender");
      return false;
    }

    if (!data.age || data.age < 18) {
      toast.error("Please enter a valid age (18 or above)");
      return false;
    }

    if (!data.phoneNumber || !/^\d{10}$/.test(data.phoneNumber)) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }

    if (!data.emailId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailId)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!data.occupation.trim()) {
      toast.error("Please enter occupation");
      return false;
    }

    if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
      toast.error("Please enter a valid amount");
      return false;
    }

    if (!data.roomNumber.trim()) {
      toast.error("Please enter room number");
      return false;
    }

    if (!data.floorNumber.trim()) {
      toast.error("Please enter floor number");
      return false;
    }

    if (!data.roomType) {
      toast.error("Please select room type");
      return false;
    }

    return true;
  };

  const addMember = async () => {
    if (!validateForm()) return;

    // Double check room availability before submitting
    const roomInfo = roomOccupancy[data.roomNumber];
    const capacity = getRoomCapacity(data.roomType);
    if (roomInfo && roomInfo.count >= capacity) {
      toast.error(
        `Room ${data.roomNumber} is already at full capacity for ${data.roomType} sharing`
      );
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("profilePic", image);
    formData.append("fullName", data.fullName);
    formData.append("gender", data.gender);
    formData.append("age", data.age);
    formData.append("phoneNumber", data.phoneNumber);
    formData.append("emailId", data.emailId);
    formData.append("parentsNumber", data.parentsNumber);
    formData.append("address", data.address);
    formData.append("occupation", data.occupation);
    formData.append("amount", data.amount);
    formData.append("status", data.status);
    formData.append("roomNumber", data.roomNumber);
    formData.append("floorNumber", data.floorNumber);
    formData.append("roomType", data.roomType);

    try {
      const response = await axios.post(
        `${url}/api/member/add`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Member Added Successfully");
        // Refresh room occupancy data immediately
        await fetchRoomOccupancy();
        // Reset form
        setData({
          fullName: "",
          gender: "",
          age: "",
          phoneNumber: "",
          emailId: "",
          parentsNumber: "",
          address: "",
          occupation: "",
          amount: "",
          status: "active",
          roomNumber: "",
          floorNumber: "",
          roomType: "single",
        });
        setImage(null);
      } else {
        toast.error(response.data.message || "Failed to add member");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding member");
    } finally {
      setLoading(false);
    }
  };

  const getFloorFromRoom = (roomNumber) => {
    if (roomNumber.startsWith("G")) return "G";
    return roomNumber.charAt(0);
  };

  return (
    <div className="add-member">
      <h2>Add New Member</h2>

      <div className="member-form">
        <div className="form-group">
          <p>
            Profile Picture <span className="required">*</span>
          </p>
          <label
            htmlFor="file-input"
            className={`image-upload ${dragOver ? "drag-over" : ""} ${
              imageError ? "error" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDrop={handleImageDrop}
          >
            <img
              src={image ? URL.createObjectURL(image) : upload_area}
              className="profile-preview"
              alt={image ? "Profile preview" : "Upload area"}
            />
            {!image && (
              <div className="upload-overlay">
                <i className="fas fa-cloud-upload-alt"></i>
                <p>Drag and drop an image here or click to browse</p>
                <small>Maximum file size: 5MB</small>
              </div>
            )}
            {imageError && <div className="error-message">{imageError}</div>}
          </label>
          <input
            onChange={imageHandler}
            type="file"
            name="image"
            id="file-input"
            accept="image/*"
            hidden
          />
        </div>

        <div className="form-group">
          <p>
            Full Name <span className="required">*</span>
          </p>
          <input
            value={data.fullName}
            onChange={inputHandler}
            type="text"
            name="fullName"
            placeholder="Enter full name"
            className="form-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <p>
              Gender <span className="required">*</span>
            </p>
            <select
              value={data.gender}
              onChange={inputHandler}
              name="gender"
              className="form-input"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <p>
              Age <span className="required">*</span>
            </p>
            <input
              value={data.age}
              onChange={inputHandler}
              type="number"
              name="age"
              placeholder="Enter age"
              min="18"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <p>
              Phone Number <span className="required">*</span>
            </p>
            <input
              value={data.phoneNumber}
              onChange={inputHandler}
              type="tel"
              name="phoneNumber"
              placeholder="Enter 10-digit phone number"
              pattern="[0-9]{10}"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <p>
              Parent's Number <span className="required">*</span>
            </p>
            <input
              value={data.parentsNumber}
              onChange={inputHandler}
              type="tel"
              name="parentsNumber"
              placeholder="Enter parent's 10-digit number"
              pattern="[0-9]{10}"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <p>
              Email ID <span className="required">*</span>
            </p>
            <input
              value={data.emailId}
              onChange={inputHandler}
              type="email"
              name="emailId"
              placeholder="Enter email address"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <p>
            Address <span className="required">*</span>
          </p>
          <textarea
            value={data.address}
            onChange={inputHandler}
            name="address"
            placeholder="Enter full address"
            className="form-input"
            rows="3"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <p>
              Occupation <span className="required">*</span>
            </p>
            <input
              value={data.occupation}
              onChange={inputHandler}
              type="text"
              name="occupation"
              placeholder="Enter occupation"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <p>
              Amount <span className="required">*</span>
            </p>
            <input
              value={data.amount}
              onChange={inputHandler}
              type="number"
              name="amount"
              placeholder="Enter amount"
              min="0"
              step="1"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <p>Status</p>
          <select
            value={data.status}
            onChange={inputHandler}
            name="status"
            className="form-input"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="form-section">
          <h3>Room Information</h3>
          <div className="form-group">
            <p>
              Room Type <span className="required">*</span>
            </p>
            <select
              value={data.roomType}
              onChange={inputHandler}
              name="roomType"
              className="form-input"
            >
              {roomTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <p>
                Floor Number <span className="required">*</span>
              </p>
              <select
                value={data.floorNumber}
                onChange={inputHandler}
                name="floorNumber"
                className="form-input"
              >
                <option value="">Select Floor</option>
                <option value="G">Ground Floor</option>
                <option value="1">1st Floor</option>
                <option value="2">2nd Floor</option>
                <option value="3">3rd Floor</option>
                <option value="4">4th Floor</option>
                <option value="5">5th Floor</option>
                <option value="6">6th Floor</option>
                <option value="7">7th Floor</option>
              </select>
            </div>

            <div className="form-group">
              <p>
                Room Number <span className="required">*</span>
              </p>
              <select
                value={data.roomNumber}
                onChange={inputHandler}
                name="roomNumber"
                className="form-input"
                disabled={!data.floorNumber}
              >
                <option value="">Select Room</option>
                {filteredRooms.map((room) => {
                  const occupancy = roomOccupancy[room];
                  const occupancyInfo = occupancy
                    ? ` (${occupancy.count}/${getRoomCapacity(
                        occupancy.roomType
                      )} occupied)`
                    : " (empty)";
                  return (
                    <option key={room} value={room}>
                      {room}
                      {occupancyInfo}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        <button className="submit-btn" onClick={addMember} disabled={loading}>
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> ADDING MEMBER...
            </>
          ) : (
            "ADD MEMBER"
          )}
        </button>
      </div>
    </div>
  );
};

export default AddMember;
