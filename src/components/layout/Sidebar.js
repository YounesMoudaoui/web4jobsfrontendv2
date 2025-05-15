import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Sidebar.css';

const Sidebar = ({ userRole, activeSection, setActiveSection, onToggleSidebar, collapsed }) => {
    const navigate = useNavigate();
    
    // useEffect(() => {
    //     console.log('Sidebar Component Mounted');
    //     console.log('Props:', { userRole, activeSection, collapsed });
    // }, [userRole, activeSection, collapsed]);

    const role = userRole;
    // console.log('Sidebar Role:', role); // Optional: keep for very specific debugging if needed

    let sections = [];
    try {
        if (role === 'ADMIN') {
            sections = [
                { id: 'users', label: 'Gestion des Utilisateurs', icon: '👥' },
                { id: 'entreprises', label: 'Gestion des Entreprises', icon: '🏢' },
                { id: 'centres', label: 'Gestion des Centres', icon: '📍' },
            ];
        } else if (role === 'RECRUTEUR') {
            sections = [
                { id: 'job-offers', label: 'Gestion des Offres', icon: '📄' }
            ];
        } else if (role === 'RESPONSABLE_CENTRE') {
            sections = [
                { id: 'centres', label: 'Mon Centre', icon: '📍' }
            ];
        } else {
            sections = [];
        }
    } catch (error) {
        // console.error('Error in Sidebar sections generation:', error); // Optional
        sections = [];
    }

    // console.log('Sidebar Sections:', sections); // Optional

    if (!role || sections.length === 0) {
        // console.warn('No sections available for role or role not provided:', role); // Optional
        return null; // Keep this to avoid rendering an empty sidebar
    }

    return (
        <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
            <button className="sidebar-toggle" onClick={onToggleSidebar} aria-label="Réduire/étendre la sidebar">
                <span className="hamburger"></span>
                <span className="hamburger"></span>
                <span className="hamburger"></span>
            </button>
            <div className="sidebar-header">
                {!collapsed && <h2>Menu</h2>}
            </div>
            <ul className="sidebar-menu">
                {sections.map(section => (
                    <li 
                        key={section.id}
                        className={activeSection === section.id ? 'active' : ''}
                        onClick={() => {
                            setActiveSection(section.id);
                        }}
                        title={section.label}
                    >
                        <span className="icon">{section.icon}</span>
                        {!collapsed && <span className="label">{section.label}</span>}
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default Sidebar; 