import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import '../styles/Auth.css';
import w4jlogo from '../assets/w4jlogo.png';

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/login';

  const handleTabClick = (tab) => {
    navigate(tab === 'login' ? '/login' : '/register');
  };

  return (
    <div className="auth-card">
      <img src={w4jlogo} alt="Web4Jobs Logo" className="auth-logo" />
      <div className="auth-tabs">
        <button
          className={isLogin ? 'auth-tab active' : 'auth-tab'}
          onClick={() => handleTabClick('login')}
        >
          Connexion
        </button>
        <button
          className={!isLogin ? 'auth-tab active' : 'auth-tab'}
          onClick={() => handleTabClick('register')}
        >
          Inscription
        </button>
      </div>
      <div className="auth-form-content">
        {isLogin ? <Login /> : <Register />}
      </div>
    </div>
  );
};

export default AuthPage; 