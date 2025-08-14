import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';
import './Login.css';

const validCredentials = [
  { email: 'lovelyboyarun91@gmail.com', password: 'vali@18024' },
  { email: 'vanithanaidukolla@gmail.com', password: 'vanitha@123' }
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    const isValidUser = validCredentials.some(
      cred => cred.email === email && cred.password === password
    );

    if (isValidUser) {
      // Store auth state
      localStorage.setItem('adminAuth', JSON.stringify({ email, isAuthenticated: true }));
      toast.success('Login successful!');
      navigate('/memberslist');
    } else {
      toast.error('Invalid credentials!');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={assets.logo} alt="Chanvi Farms Logo" className="login-logo" />
        <h3>GET INN Luxury Colive PG</h3>
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;