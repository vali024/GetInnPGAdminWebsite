import './Sidebar.css'
import {NavLink} from 'react-router-dom'
import { FaList, FaPlus, FaMoneyCheck, FaUsers, FaBed } from 'react-icons/fa'

const Sidebar = () => {
  return (
    <div className="sidebar">
        <div className="sidebar-options">
            <NavLink to='/addmember' className="sidebar-option">
                <FaPlus className="icon" />
                <p>Add Member</p>
            </NavLink>
            <NavLink to='/memberslist' className="sidebar-option">
                <FaUsers className="icon" />
                <p>Members List</p>
            </NavLink>
            <NavLink to='/rentaldata' className="sidebar-option">
                <FaMoneyCheck className="icon" />
                <p>Rental Data</p>
            </NavLink>
            <NavLink to='/rooms' className="sidebar-option">
                <FaBed className="icon" />
                <p>Rooms</p>
            </NavLink>
        </div>
    
    </div>
  )
}

export default Sidebar