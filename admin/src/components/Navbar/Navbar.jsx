import './Navbar.css'
import { assets } from "../../assets/assets"
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useEffect } from 'react'

const Navbar = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status on mount and changes
    const auth = localStorage.getItem('adminAuth');
    if (!auth) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    try {
      // Clear all auth-related data
      localStorage.clear();
      sessionStorage.clear();
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Force navigation to login
      setTimeout(() => {
        navigate('/login', { replace: true });
        window.location.reload(); // Force reload to clear any cached states
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout. Please try again.');
    }
  };

  const auth = JSON.parse(localStorage.getItem('adminAuth'));

  return (
    <div className="navbar">
      <img className='logo' src={assets.logo} alt=""/>
      <div className="nav-right">
        {auth?.email && (
          <span className="admin-email">{auth.email}</span>
        )}
        <button 
          onClick={handleLogout} 
          className="logout-btn"
          type="button"
        >
          <i className="fas fa-sign-out-alt"></i>
          Logout
        </button>
      </div>
    </div>
  )
}

export default Navbar