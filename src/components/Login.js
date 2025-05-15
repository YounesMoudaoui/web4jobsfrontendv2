import React, { useState } from 'react';
import { useNavigate /*, Link*/ } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Create a plain JavaScript object for the payload
            const payload = {
                email: email,
                password: password
            };

            // Send as application/json
            const response = await axios.post('http://localhost:8080/api/login', payload, {
                headers: {
                    'Content-Type': 'application/json' // Set Content-Type to application/json
                },
                withCredentials: true
            });

            if (response.data.status === 'success') {
                const userInfo = {
                    email: response.data.email,
                    role: response.data.role,
                    firstName: response.data.firstName,
                    lastName: response.data.lastName
                };

                // Store user info as a string
                localStorage.setItem('user', JSON.stringify(userInfo));
                
                // Explicitly set userRole
                localStorage.setItem('userRole', response.data.role);

                if (response.data.role === 'ADMIN' || response.data.role === 'DIRECTEUR_EXECUTIF') {
                    navigate('/admin-dashboard');
                } else if (response.data.role === 'RECRUTEUR') {
                    navigate('/recruiter-dashboard');
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err) {
            if (err.response) {
                setError(err.response.data.message || 'Une erreur est survenue lors de la connexion');
            } else if (err.request) {
                setError('Impossible de se connecter au serveur');
            } else {
                setError('Une erreur est survenue');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit} className="auth-form-content">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button 
                    type="submit" 
                    className="button-primary"
                    disabled={isLoading}
                >
                    {isLoading ? 'Connexion...' : 'Se connecter'}
                </button>
            </form>
        </>
    );
}

export default Login;
