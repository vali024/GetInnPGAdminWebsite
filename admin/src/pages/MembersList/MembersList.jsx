import { useState, useEffect } from "react";
import "./MembersList.css";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaSpinner,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheck,
  FaSearch,
} from "react-icons/fa";

const MembersList = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    memberId: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    gender: "all",
    status: "all",
    floorNumber: "all",
  });

  const url = "http://localhost:4000";

  // Get unique genders from the members
  const genders = ["all", ...new Set(members.map((member) => member.gender))];
  const statuses = ["all", "active", "inactive"];
  const floorNumbers = ["all", "G", "1", "2", "3", "4", "5", "6", "7"];

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${url}/api/member/list`);

      if (response.data && response.data.success) {
        setMembers(response.data.data || []);
      } else {
        throw new Error(response.data?.message || "Failed to fetch members");
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      setError(error.message || "Error loading members");
      toast.error(error.message || "Error loading members");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirmation({ show: true, memberId: id });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.memberId) {
      try {
        const response = await axios.post(`${url}/api/member/delete`, {
          id: deleteConfirmation.memberId,
        });

        if (response.data.success) {
          toast.success("Member deleted successfully");
          // Fetch members to update the list
          await fetchMembers();

          // Notify AddMember component to refresh room occupancy via custom event
          const event = new CustomEvent("roomOccupancyChanged");
          window.dispatchEvent(event);
        } else {
          toast.error(response.data.message || "Failed to delete member");
        }
      } catch (error) {
        console.error("Error deleting member:", error);
        toast.error("Error deleting member");
      }
    }
    setDeleteConfirmation({ show: false, memberId: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, memberId: null });
  };

  const handleEdit = (member) => {
    setEditingMember(member);
  };

  const handleSave = async () => {
    if (!editingMember) return;
    try {
      const response = await axios.post(`${url}/api/member/update`, {
        id: editingMember._id,
        status: editingMember.status,
        roomNumber: editingMember.roomNumber,
        floorNumber: editingMember.floorNumber,
        roomType: editingMember.roomType,
        amount: editingMember.amount,
      });

      if (response.data.success) {
        toast.success("Member updated successfully");
        fetchMembers();
        setEditingMember(null);
      } else {
        toast.error(response.data.message || "Failed to update member");
      }
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error("Error updating member");
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Filter members based on search query and filters
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phoneNumber.includes(searchQuery) ||
      member.emailId.toLowerCase().includes(searchQuery) ||
      member.roomNumber.includes(searchQuery);

    const matchesGender =
      filters.gender === "all" || member.gender === filters.gender;
    const matchesStatus =
      filters.status === "all" || member.status === filters.status;
    const matchesFloor =
      filters.floorNumber === "all" || member.floorNumber === filters.floorNumber;

    return matchesSearch && matchesGender && matchesStatus && matchesFloor;
  });

  if (loading) {
    return (
      <div className="list add flex-col loading-state">
        <p>Loading members...</p>
        <div className="loading-spinner">
          <FaSpinner className="spinner-icon" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="list add flex-col error-state">
        <p>Error: {error}</p>
        <button onClick={fetchMembers} className="retry-btn">
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="list add flex-col">
      {deleteConfirmation.show && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-dialog">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this member?</p>
            <div className="dialog-buttons">
              <button onClick={confirmDelete} className="confirm-btn">
                Yes, Delete
              </button>
              <button onClick={cancelDelete} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="list-header">
        <div className="list-title">
          <p>Members</p>
          <span className="member-count" title="Total number of members">
            {filteredMembers.length}{" "}
            {filteredMembers.length === 1 ? "member" : "members"}
          </span>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search members by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          {searchQuery && (
            <FaTimes
              className="clear-search"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            />
          )}
        </div>
        <div className="filters">
          <select
            value={filters.gender}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, gender: e.target.value }))
            }
          >
            {genders.map((gender) => (
              <option key={gender} value={gender}>
                {gender === "all"
                  ? "All Genders"
                  : gender.charAt(0).toUpperCase() + gender.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={filters.floorNumber}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, floorNumber: e.target.value }))
            }
          >
            {floorNumbers.map((floor) => (
              <option key={floor} value={floor}>
                {floor === "all"
                  ? "All Floors"
                  : `Floor ${floor}`}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "all"
                  ? "All Status"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="list-table">
        <div className="list-table-format title">
          <p>Profile</p>
          <p>Name</p>
          <p>Contact</p>
          <p>Room Info</p>
          <p>Details</p>
          <p>Amount</p>
          <p>Status</p>
          <p>Actions</p>
        </div>
        {filteredMembers.map((member) => (
          <div
            key={member._id}
            className={`list-table-format ${
              member.status !== "active" ? "disabled" : ""
            }`}
          >
            <img
              src={
                member.profilePic
                  ? `${url}/uploads/${member.profilePic}`
                  : defaultImage
              }
              alt={member.fullName}
              className={member.status !== "active" ? "grayscale" : ""}
              onError={(e) => {
                e.target.src = defaultImage;
              }}
            />
            <div className="name-info">
              <p className="member-name">{member.fullName}</p>
              <span className="member-gender">{member.gender}</span>
            </div>
            <div className="contact-info">
              <p>{member.phoneNumber}</p>
              <span>{member.emailId}</span>
            </div>
            <div className="room-info">
              {editingMember?._id === member._id ? (
                <div className="edit-room-info">
                  <input
                    type="text"
                    value={editingMember.roomNumber}
                    onChange={(e) =>
                      setEditingMember((prev) => ({
                        ...prev,
                        roomNumber: e.target.value,
                      }))
                    }
                    placeholder="Room Number"
                  />
                  <input
                    type="text"
                    value={editingMember.floorNumber}
                    onChange={(e) =>
                      setEditingMember((prev) => ({
                        ...prev,
                        floorNumber: e.target.value,
                      }))
                    }
                    placeholder="Floor Number"
                  />
                  <input
                    type="text"
                    value={editingMember.roomType}
                    onChange={(e) =>
                      setEditingMember((prev) => ({
                        ...prev,
                        roomType: e.target.value,
                      }))
                    }
                    placeholder="Room Type"
                  />
                </div>
              ) : (
                <>
                  <p>Room {member.roomNumber}</p>
                  <span>
                    Floor {member.floorNumber} • {member.roomType}
                  </span>
                </>
              )}
            </div>
            <div className="other-details">
              <p>{member.occupation}</p>
              <span>{member.age} years old</span>
            </div>
            <div className="amount-info">
              {editingMember?._id === member._id ? (
                <input
                  type="number"
                  value={editingMember.amount}
                  onChange={(e) =>
                    setEditingMember((prev) => ({
                      ...prev,
                      amount: parseFloat(e.target.value),
                    }))
                  }
                  className="edit-amount"
                  min="0"
                />
              ) : (
                <span className="amount">
                  ₹{member.amount.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <div className="status-selector">
              {editingMember?._id === member._id ? (
                <select
                  value={editingMember.status}
                  onChange={(e) => {
                    setEditingMember((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }));
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              ) : (
                <span className={`status-badge ${member.status}`}>
                  {member.status}
                </span>
              )}
            </div>
            <div className="actions">
              {editingMember?._id === member._id ? (
                <>
                  <button
                    onClick={handleSave}
                    className="save-btn"
                    title="Save Changes"
                  >
                    <FaCheck />
                  </button>
                  <button
                    onClick={() => setEditingMember(null)}
                    className="cancel-btn"
                    title="Cancel"
                  >
                    <FaTimes />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleEdit(member)}
                    className="edit-btn"
                    title="Edit Member"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(member._id)}
                    className="remove-btn"
                    title="Delete Member"
                  >
                    <FaTrash />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembersList;
