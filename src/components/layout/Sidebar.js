import React, { useEffect } from 'react';
import '../../styles/Sidebar.css';

const Sidebar = ({ activeSection, setActiveSection, onToggleSidebar, collapsed }) => {
    useEffect(() => {
        console.log('Sidebar Component Mounted');
        console.log('Props:', { activeSection, collapsed });
    }, []);

    const role = localStorage.getItem('userRole');
    console.log('Sidebar Role:', role);

    // Définir les sections selon le rôle
    let sections = [];
    try {
        if (role === 'ADMIN') {
            sections = [
                { id: 'users', label: 'Gestion des Utilisateurs', icon: '👥' },
                { id: 'entreprises', label: 'Gestion des Entreprises', icon: '🏢' },
                { id: 'centres', label: 'Gestion des Centres', icon: '📍' },
                { id: 'assignments', label: 'Assignations', icon: '🔗' },
                { id: 'validation', label: 'Validation des Candidats', icon: '✅' }
            ];
        } else if (role === 'RECRUTEUR') {
            sections = [
                { id: 'entreprises', label: 'Mes Entreprises', icon: '🏢' }
                // Ajoute d'autres sections spécifiques au recruteur ici
            ];
        } else if (role === 'RESPONSABLE_CENTRE') {
            sections = [
                { id: 'centres', label: 'Mon Centre', icon: '📍' }
                // Ajoute d'autres sections spécifiques ici
            ];
        } else {
            // Par défaut, aucune section ou sections publiques
            sections = [];
        }
    } catch (error) {
        console.error('Error in Sidebar sections generation:', error);
        sections = [];
    }

    console.log('Sidebar Sections:', sections);

    // Si aucune section n'est disponible, ne pas rendre le composant
    if (sections.length === 0) {
        console.warn('No sections available for role:', role);
        return null;
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
                        onClick={() => setActiveSection(section.id)}
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