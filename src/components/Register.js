import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Auth.css';

const Register = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'APPRENANT',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('http://localhost:8080/api/register', form);
      setSuccess('Inscription réussie ! Vous pouvez vous connecter.');
      setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'APPRENANT' });
    } catch (err) {
      setError(err.response?.data || 'Erreur lors de l\'inscription.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="firstName" placeholder="Prénom" value={form.firstName} onChange={handleChange} required />
      <input name="lastName" placeholder="Nom" value={form.lastName} onChange={handleChange} required />
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
      <input name="password" type="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} required />
      <input name="phone" placeholder="Téléphone" value={form.phone} onChange={handleChange} />
      <select name="role" value={form.role} onChange={handleChange} required>
        <option value="APPRENANT">Apprenant</option>
        <option value="LAUREAT">Lauréat</option>
      </select>
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}
      <button className="button-primary" type="submit">S'inscrire</button>
    </form>
  );
};

export default Register;
