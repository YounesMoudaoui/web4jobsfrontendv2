import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './layout/Navbar';
import Sidebar from './layout/Sidebar';
import '../styles/AdminDashboard.css';

// Composant Modal réutilisable
const Modal = ({ open, onClose, children }) => {
    if (!open) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [user, setUser] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', role: '' });
    const [entreprise, setEntreprise] = useState({ nom: '', logoUrl: '', careerPageUrl: '' });
    const [centre, setCentre] = useState({ ville: '', nom: '', emailDomain: '' });
    const [editRecruiterEntreprises, setEditRecruiterEntreprises] = useState({ userId: '', entrepriseId: '', entrepriseNames: '', isIntermediate: false });
    const [users, setUsers] = useState([]);
    const [entreprises, setEntreprises] = useState([]);
    const [centres, setCentres] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [editingUserCentre, setEditingUserCentre] = useState({ userId: '', centreId: '', centreName: '' });
    const [editingEntreprise, setEditingEntreprise] = useState(null);
    const [editingCentre, setEditingCentre] = useState(null);
    const [activeSection, setActiveSection] = useState('users');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showCreateUserForm, setShowCreateUserForm] = useState(false);
    const [showCreateEntrepriseForm, setShowCreateEntrepriseForm] = useState(false);
    const [showCreateCentreForm, setShowCreateCentreForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(null);

    const checkAuth = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/auth/validate-token', {
                withCredentials: true
            });
            
            if (response.data.role !== 'ADMIN' && response.data.role !== 'DIRECTEUR_EXECUTIF') {
                navigate('/login');
                return null;
            }
            setCurrentUser(response.data);
            return response.data;
        } catch (error) {
            navigate('/login');
            return null;
        }
    }, [navigate]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const authedUser = await checkAuth();
        if (!authedUser) {
            setLoading(false);
            return;
        }
        
        try {
            const [usersResponse, entreprisesResponse, centresResponse] = await Promise.all([
                axios.get('http://localhost:8080/api/admin/users', { withCredentials: true }),
                axios.get('http://localhost:8080/api/admin/entreprises', { withCredentials: true }),
                axios.get('http://localhost:8080/api/admin/centres', { withCredentials: true }),
            ]);

            setUsers(usersResponse.data);
            setEntreprises(entreprisesResponse.data);
            setCentres(centresResponse.data);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                navigate('/login');
            } else {
                setError('Erreur lors du chargement des données');
            }
        } finally {
            setLoading(false);
        }
    }, [checkAuth, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Chargement des données...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p className="error-message">{error}</p>
                <button onClick={() => window.location.reload()}>Réessayer</button>
            </div>
        );
    }

    if (!currentUser) {
        return <p>Authenticating admin...</p>;
    }

    const userRole = currentUser ? currentUser.role : null;
    const isAdminRole = userRole === 'ADMIN' || userRole === 'DIRECTEUR_EXECUTIF';

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            console.log('Tentative de création d\'utilisateur:', user);
            const response = await axios.post('/api/admin/users', user, { withCredentials: true });
            console.log('Utilisateur créé avec succès:', response.data);
            alert('Utilisateur créé avec succès');
            fetchData();
            setUser({ firstName: '', lastName: '', email: '', password: '', phone: '', role: '' });
            setShowCreateUserForm(false);
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            if (error.response) {
                console.error('Détails de l\'erreur:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            alert('Erreur lors de la création de l\'utilisateur');
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        if (user.role === 'RESPONSABLE_CENTRE' && user.centre) {
            setEditingUserCentre({
                userId: user.id,
                centreId: user.centre.id,
                centreName: user.centre.nom
            });
        } else {
            setEditingUserCentre({ userId: '', centreId: '', centreName: '' });
        }
        if (user.role === 'RECRUTEUR') {
            setEditRecruiterEntreprises({
                userId: user.id,
                entrepriseId: user.entreprises && user.entreprises.length > 0 ? user.entreprises[0].id : '',
                entrepriseNames: user.entreprises ? user.entreprises.map(e => e.nom).join(', ') : '',
                isIntermediate: user.isIntermediateRecruiter || false
            });
        } else {
            setEditRecruiterEntreprises({ userId: '', entrepriseId: '', entrepriseNames: '', isIntermediate: false });
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            // Mise à jour des informations de base de l'utilisateur
            await axios.put(`/api/admin/users/${editingUser.id}`, editingUser, { withCredentials: true });

            // Gestion des assignations selon le rôle
            if (editingUser.role === 'RESPONSABLE_CENTRE' && editingUserCentre.centreId) {
                await axios.post('/api/admin/assign-responsable', null, {
                    params: {
                        userId: editingUser.id,
                        centreId: editingUserCentre.centreId
                    },
                    withCredentials: true
                });
            } else if (editingUser.role === 'RECRUTEUR') {
                if (editRecruiterEntreprises.isIntermediate) {
                    // Pour un recruteur intermédiaire
                    await axios.post('/api/admin/assign-intermediate-recruiter', null, {
                        params: {
                            userId: editingUser.id,
                            entrepriseNames: editRecruiterEntreprises.entrepriseNames
                        },
                        withCredentials: true
                    });
                } else if (editRecruiterEntreprises.entrepriseId) {
                    // Pour un recruteur non-intermédiaire
                    await axios.post('/api/admin/assign-recruiter', null, {
                        params: {
                            userId: editingUser.id,
                            entrepriseIds: editRecruiterEntreprises.entrepriseId,
                            isIntermediate: false
                        },
                        withCredentials: true
                    });
                }
            }

            alert('Utilisateur mis à jour avec succès');
            fetchData();
            setEditingUser(null);
            setEditingUserCentre({ userId: '', centreId: '', centreName: '' });
            setEditRecruiterEntreprises({ userId: '', entrepriseId: '', entrepriseNames: '', isIntermediate: false });
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
            if (error.response) {
                console.error('Détails de l\'erreur:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            alert('Erreur lors de la mise à jour de l\'utilisateur');
        }
    };

    const handleDeleteUser = async (id) => {
        try {
            await axios.delete(`/api/admin/users/${id}`, { withCredentials: true });
            alert('Utilisateur supprimé avec succès');
            fetchData();
        } catch (error) {
            alert('Erreur lors de la suppression de l\'utilisateur');
        }
    };

    const handleCreateEntreprise = async (e) => {
        e.preventDefault();
        try {
            console.log('Tentative de création d\'entreprise:', entreprise);
            const response = await axios.post('/api/admin/entreprises', entreprise, { withCredentials: true });
            console.log('Entreprise créée avec succès:', response.data);
            alert('Entreprise créée avec succès');
            fetchData();
            setEntreprise({ nom: '', logoUrl: '', careerPageUrl: '' });
            setShowCreateEntrepriseForm(false);
        } catch (error) {
            console.error('Erreur lors de la création de l\'entreprise:', error);
            if (error.response) {
                console.error('Détails de l\'erreur:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            alert('Erreur lors de la création de l\'entreprise');
        }
    };

    const handleUpdateEntreprise = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/admin/entreprises/${editingEntreprise.id}`, editingEntreprise, { withCredentials: true });
            alert('Entreprise mise à jour avec succès');
            fetchData();
            setEditingEntreprise(null);
        } catch (error) {
            alert('Erreur lors de la mise à jour de l\'entreprise');
        }
    };

    const handleDeleteEntreprise = async (id) => {
        try {
            await axios.delete(`/api/admin/entreprises/${id}`, { withCredentials: true });
            alert('Entreprise supprimée avec succès');
            fetchData();
        } catch (error) {
            alert('Erreur lors de la suppression de l\'entreprise');
        }
    };

    const handleCreateCentre = async (e) => {
        e.preventDefault();
        try {
            if (!centre.ville || !centre.nom) {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }
            console.log('Tentative de création de centre:', centre);
            const response = await axios.post('/api/admin/centres', centre, { withCredentials: true });
            console.log('Centre créé avec succès:', response.data);
            alert('Centre créé avec succès');
            fetchData();
            setCentre({ ville: '', nom: '', emailDomain: '' });
            setShowCreateCentreForm(false);
        } catch (error) {
            console.error('Erreur lors de la création du centre:', error);
            if (error.response) {
                console.error('Détails de l\'erreur:', {
                    status: error.response.status,
                    data: error.response.data
                });
                alert(`Erreur lors de la création du centre: ${error.response.data || 'Erreur inconnue'}`);
            } else {
                alert('Erreur lors de la création du centre: Impossible de se connecter au serveur');
            }
        }
    };

    const handleUpdateCentre = async (e) => {
        e.preventDefault();
        try {
            if (!editingCentre.ville || !editingCentre.nom) {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }
            await axios.put(`/api/admin/centres/${editingCentre.id}`, editingCentre, { withCredentials: true });
            alert('Centre mis à jour avec succès');
            fetchData();
            setEditingCentre(null);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du centre:', error);
            alert('Erreur lors de la mise à jour du centre');
        }
    };

    const handleDeleteCentre = async (id) => {
        try {
            await axios.delete(`/api/admin/centres/${id}`, { withCredentials: true });
            alert('Centre supprimé avec succès');
            fetchData();
        } catch (error) {
            alert('Erreur lors de la suppression du centre');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'users':
                return (
                    <div className="section">
                        <h2>Gestion des Utilisateurs</h2>
                        <button className="form-toggle-btn" onClick={() => setShowCreateUserForm(true)}>
                            Créer un nouvel utilisateur
                        </button>
                        <div className="table-container users-table">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Prénom</th>
                                        <th>Nom</th>
                                        <th>Email</th>
                                        <th>Rôle</th>
                                        <th>Validé</th>
                                        <th>Entreprises</th>
                                        <th>Centres</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td>{u.id}</td>
                                            <td>{u.firstName}</td>
                                            <td>{u.lastName}</td>
                                            <td>{u.email}</td>
                                            <td>{u.role}</td>
                                            <td>{u.isValidated ? 'Oui' : 'Non'}</td>
                                            <td>{u.entreprises ? u.entreprises.map(e => e.nom).join(', ') : '-'}</td>
                                            <td>
                                                {u.role === 'RESPONSABLE_CENTRE' && u.centre ? 
                                                    `${u.centre.nom} - ${u.centre.ville}` : 
                                                    '-'
                                                }
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-edit" onClick={() => handleEditUser(u)}>
                                                        Modifier
                                                    </button>
                                                    <button className="btn-delete" onClick={() => handleDeleteUser(u.id)}>
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'entreprises':
                return (
                    <div className="section">
                        <h2>Gestion des Entreprises</h2>
                        <button className="form-toggle-btn" onClick={() => setShowCreateEntrepriseForm(true)}>
                            Créer une nouvelle entreprise
                        </button>
                        <div className="table-container entreprises-table">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nom</th>
                                        <th className="logo-col">Logo</th>
                                        <th>Page Carrière</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entreprises.map(e => (
                                        <tr key={e.id}>
                                            <td>{e.id}</td>
                                            <td>{e.nom}</td>
                                            <td className="logo-col">
                                                {e.logoUrl ? (
                                                    <img src={e.logoUrl} alt="Logo" style={{maxWidth:'60px', maxHeight:'40px', borderRadius:'4px', background:'#f5f5f5'}} />
                                                ) : (
                                                    <span style={{color:'#aaa'}}>Aucun</span>
                                                )}
                                            </td>
                                            <td>{e.careerPageUrl}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-edit" onClick={() => setEditingEntreprise(e)}>
                                                        Modifier
                                                    </button>
                                                    <button className="btn-delete" onClick={() => handleDeleteEntreprise(e.id)}>
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'centres':
                return (
                    <div className="section">
                        <h2>Gestion des Centres</h2>
                        <button className="form-toggle-btn" onClick={() => setShowCreateCentreForm(true)}>
                            Créer un nouveau centre
                        </button>
                        {showCreateCentreForm && (
                            <Modal open={showCreateCentreForm} onClose={() => setShowCreateCentreForm(false)}>
                                <form onSubmit={handleCreateCentre} className="form-card">
                                    <h3>Créer un nouveau centre</h3>
                                    <input 
                                        type="text" 
                                        placeholder="Ville" 
                                        value={centre.ville} 
                                        onChange={(e) => setCentre({ ...centre, ville: e.target.value })} 
                                        required
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Nom" 
                                        value={centre.nom} 
                                        onChange={(e) => setCentre({ ...centre, nom: e.target.value })} 
                                        required
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Domaine email (ex: @centre.com)" 
                                        value={centre.emailDomain} 
                                        onChange={(e) => setCentre({ ...centre, emailDomain: e.target.value })} 
                                    />
                                    <div className="modal-actions">
                                        <button type="button" className="form-toggle-btn" onClick={() => setShowCreateCentreForm(false)}>Annuler</button>
                                        <button type="submit">Créer</button>
                                    </div>
                                </form>
                            </Modal>
                        )}
                        <div className="table-container centres-table">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Ville</th>
                                        <th>Nom</th>
                                        <th>Domaine Email</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {centres.map(c => (
                                        <tr key={c.id}>
                                            <td>{c.id}</td>
                                            <td>{c.ville}</td>
                                            <td>{c.nom}</td>
                                            <td>{c.emailDomain || '-'}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-edit" onClick={() => setEditingCentre(c)}>
                                                        Modifier
                                                    </button>
                                                    <button className="btn-delete" onClick={() => handleDeleteCentre(c.id)}>
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`admin-dashboard${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
            <Navbar 
                userRole={userRole}
                onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                sidebarCollapsed={sidebarCollapsed}
                onLogout={handleLogout}
            />
            {isAdminRole ? (
                <Sidebar 
                    userRole={userRole}
                    activeSection={activeSection} 
                    setActiveSection={setActiveSection} 
                    onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                    collapsed={sidebarCollapsed}
                />
            ) : (
                <div style={{color: 'red'}}>Sidebar not rendered: User role is not ADMIN</div>
            )}
            <main className="main-content">
                {renderSection()}
                <Modal open={showCreateUserForm} onClose={() => setShowCreateUserForm(false)}>
                    <form onSubmit={handleCreateUser} className="form-card">
                        <h3>Créer un nouvel utilisateur</h3>
                        <input type="text" placeholder="Prénom" value={user.firstName} onChange={(e) => setUser({ ...user, firstName: e.target.value })} />
                        <input type="text" placeholder="Nom" value={user.lastName} onChange={(e) => setUser({ ...user, lastName: e.target.value })} />
                        <input type="email" placeholder="Email" value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} />
                        <input type="password" placeholder="Mot de passe" value={user.password} onChange={(e) => setUser({ ...user, password: e.target.value })} />
                        <input type="text" placeholder="Téléphone" value={user.phone} onChange={(e) => setUser({ ...user, phone: e.target.value })} />
                        <select value={user.role} onChange={(e) => setUser({ ...user, role: e.target.value })}>
                            <option value="">Sélectionner un rôle</option>
                            <option value="ADMIN">Administrateur</option>
                            <option value="DIRECTEUR_EXECUTIF">Directeur Exécutif</option>
                            <option value="RESPONSABLE_CENTRE">Responsable de Centre</option>
                            <option value="RECRUTEUR">Recruteur</option>
                            <option value="APPRENANT">Apprenant</option>
                            <option value="LAUREAT">Lauréat</option>
                        </select>
                        <div className="modal-actions">
                            <button type="button" onClick={() => setShowCreateUserForm(false)} className="form-toggle-btn">Annuler</button>
                            <button type="submit">Créer</button>
                        </div>
                    </form>
                </Modal>
                <Modal open={showCreateEntrepriseForm} onClose={() => setShowCreateEntrepriseForm(false)}>
                    <form onSubmit={handleCreateEntreprise} className="form-card">
                        <h3>Créer une nouvelle entreprise</h3>
                        <input type="text" placeholder="Nom" value={entreprise.nom} onChange={(e) => setEntreprise({ ...entreprise, nom: e.target.value })} />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    try {
                                        const response = await axios.post('/api/admin/upload-logo', formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                        });
                                        setEntreprise({ ...entreprise, logoUrl: response.data });
                                    } catch (err) {
                                        alert("Erreur lors de l'upload du logo");
                                    }
                                }
                            }}
                        />
                        {entreprise.logoUrl && (
                            <div style={{marginBottom:'10px'}}>
                                <img src={entreprise.logoUrl} alt="Logo preview" style={{maxWidth:'100px', maxHeight:'60px', display:'block', marginTop:'8px'}} />
                            </div>
                        )}
                        <input type="text" placeholder="URL page carrière" value={entreprise.careerPageUrl} onChange={(e) => setEntreprise({ ...entreprise, careerPageUrl: e.target.value })} />
                        <div className="modal-actions">
                            <button type="button" onClick={() => setShowCreateEntrepriseForm(false)} className="form-toggle-btn">Annuler</button>
                            <button type="submit">Créer</button>
                        </div>
                    </form>
                </Modal>
                <Modal open={!!editingUser} onClose={() => setEditingUser(null)}>
                    {editingUser && (
                        <form onSubmit={handleUpdateUser} className="form-card">
                            <h3>Modifier l'utilisateur</h3>
                            <input type="text" placeholder="Prénom" value={editingUser.firstName} onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })} />
                            <input type="text" placeholder="Nom" value={editingUser.lastName} onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })} />
                            <input type="email" placeholder="Email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} />
                            <input type="password" placeholder="Nouveau mot de passe (optionnel)" onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} />
                            <input type="text" placeholder="Téléphone" value={editingUser.phone} onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })} />
                            <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
                                <option value="">Sélectionner un rôle</option>
                                <option value="ADMIN">Administrateur</option>
                                <option value="DIRECTEUR_EXECUTIF">Directeur Exécutif</option>
                                <option value="RESPONSABLE_CENTRE">Responsable de Centre</option>
                                <option value="RECRUTEUR">Recruteur</option>
                                <option value="APPRENANT">Apprenant</option>
                                <option value="LAUREAT">Lauréat</option>
                            </select>
                            {editingUser.role === 'RESPONSABLE_CENTRE' && (
                                <select
                                    value={editingUserCentre.centreName}
                                    onChange={(e) => {
                                        const selectedCentre = centres.find(c => c.nom === e.target.value);
                                        setEditingUserCentre({
                                            ...editingUserCentre,
                                            centreId: selectedCentre ? selectedCentre.id : '',
                                            centreName: e.target.value
                                        });
                                    }}
                                >
                                    <option value="">Sélectionner un centre</option>
                                    {centres.map(c => (
                                        <option key={c.id} value={c.nom}>
                                            {c.nom} - {c.ville}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {editingUser.role === 'RECRUTEUR' && (
                                <>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={editRecruiterEntreprises.isIntermediate}
                                            onChange={(e) => setEditRecruiterEntreprises({
                                                ...editRecruiterEntreprises,
                                                isIntermediate: e.target.checked,
                                                entrepriseId: '',
                                                entrepriseNames: ''
                                            })}
                                        />
                                        Recruteur intermédiaire
                                    </label>
                                    {editRecruiterEntreprises.isIntermediate ? (
                                        <input
                                            type="text"
                                            placeholder="Noms des entreprises (séparés par des virgules)"
                                            value={editRecruiterEntreprises.entrepriseNames}
                                            onChange={(e) => setEditRecruiterEntreprises({
                                                ...editRecruiterEntreprises,
                                                entrepriseNames: e.target.value
                                            })}
                                        />
                                    ) : (
                                        <select
                                            value={editRecruiterEntreprises.entrepriseId}
                                            onChange={(e) => setEditRecruiterEntreprises({
                                                ...editRecruiterEntreprises,
                                                entrepriseId: e.target.value
                                            })}
                                        >
                                            <option value="">Sélectionner une entreprise</option>
                                            {entreprises.map(e => (
                                                <option key={e.id} value={e.id}>{e.nom}</option>
                                            ))}
                                        </select>
                                    )}
                                </>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="form-toggle-btn" onClick={() => setEditingUser(null)}>Annuler</button>
                                <button type="submit">Mettre à jour</button>
                            </div>
                        </form>
                    )}
                </Modal>
                <Modal open={!!editingEntreprise} onClose={() => setEditingEntreprise(null)}>
                    {editingEntreprise && (
                        <form onSubmit={handleUpdateEntreprise} className="form-card">
                            <h3>Modifier l'entreprise</h3>
                            <input type="text" placeholder="Nom" value={editingEntreprise.nom} onChange={(e) => setEditingEntreprise({ ...editingEntreprise, nom: e.target.value })} />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        try {
                                            const response = await axios.post('/api/admin/upload-logo', formData, {
                                                headers: { 'Content-Type': 'multipart/form-data' }
                                            });
                                            setEditingEntreprise({ ...editingEntreprise, logoUrl: response.data });
                                        } catch (err) {
                                            alert("Erreur lors de l'upload du logo");
                                        }
                                    }
                                }}
                            />
                            {editingEntreprise.logoUrl && (
                                <div style={{marginBottom:'10px'}}>
                                    <img src={editingEntreprise.logoUrl} alt="Logo preview" style={{maxWidth:'100px', maxHeight:'60px', display:'block', marginTop:'8px'}} />
                                </div>
                            )}
                            <input type="text" placeholder="URL page carrière" value={editingEntreprise.careerPageUrl} onChange={(e) => setEditingEntreprise({ ...editingEntreprise, careerPageUrl: e.target.value })} />
                            <div className="modal-actions">
                                <button type="button" className="form-toggle-btn" onClick={() => setEditingEntreprise(null)}>Annuler</button>
                                <button type="submit">Mettre à jour</button>
                            </div>
                        </form>
                    )}
                </Modal>
                <Modal open={!!editingCentre} onClose={() => setEditingCentre(null)}>
                    {editingCentre && (
                        <form onSubmit={handleUpdateCentre} className="form-card">
                            <h3>Modifier le centre</h3>
                            <input 
                                type="text" 
                                placeholder="Ville" 
                                value={editingCentre.ville} 
                                onChange={(e) => setEditingCentre({ ...editingCentre, ville: e.target.value })} 
                                required
                            />
                            <input 
                                type="text" 
                                placeholder="Nom" 
                                value={editingCentre.nom} 
                                onChange={(e) => setEditingCentre({ ...editingCentre, nom: e.target.value })} 
                                required
                            />
                            <input 
                                type="text" 
                                placeholder="Domaine email (ex: @centre.com)" 
                                value={editingCentre.emailDomain || ''} 
                                onChange={(e) => setEditingCentre({ ...editingCentre, emailDomain: e.target.value })} 
                            />
                            <div className="modal-actions">
                                <button type="button" className="form-toggle-btn" onClick={() => setEditingCentre(null)}>Annuler</button>
                                <button type="submit">Mettre à jour</button>
                            </div>
                        </form>
                    )}
                </Modal>
            </main>
        </div>
    );
};

export default AdminDashboard;