import React from 'react';
import '../../styles/Navbar.css';
import w4jlogo from '../../assets/w4jlogo.png';

const Navbar = ({ onLogout }) => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <img src={w4jlogo} alt="Web4Jobs Logo" style={{ height: '40px' }} />
            </div>
            <div className="navbar-menu">
                <button onClick={onLogout} className="logout-button">
                    Déconnexion
                </button>
            </div>
        </nav>
    );
};

export default Navbar; 