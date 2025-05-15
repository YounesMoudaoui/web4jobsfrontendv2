import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios
import '../styles/JobOfferForm.css'; // Corrected import path
import { ContractType, OfferModality } from '../constants/jobOfferConstants'; // Corrected import path

// Mock enum values (ideally, fetch these or have them in a shared constants file)
// const ContractType = {
//     STAGE: 'STAGE',
// ... (rest of the old enum definitions will be removed)
// };

// const OfferModality = {
//     SUR_SITE: 'SUR_SITE',
// ... (rest of the old enum definitions will be removed)
// };

const JobOfferForm = ({ offer, onClose, onSave, recruiterProfile }) => {
    const [formData, setFormData] = useState({
        titrePoste: '',
        entrepriseId: null,
        localisation: '',
        descriptionDetaillee: '',
        competencesTechniquesRequises: [],
        competencesComportementalesRequises: [],
        education: '',
        typeContrat: ContractType.AUTRE,
        dureeContrat: '',
        typeModalite: OfferModality.SUR_SITE,
        experienceSouhaitee: '',
        certificationsDemandees: [],
        langue: '',
        remuneration: '',
        isActive: true
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const initialFormData = {
            titrePoste: '',
            entrepriseId: null,
            localisation: '',
            descriptionDetaillee: '',
            competencesTechniquesRequises: [],
            competencesComportementalesRequises: [],
            education: '',
            typeContrat: ContractType.AUTRE,
            dureeContrat: '',
            typeModalite: OfferModality.SUR_SITE,
            experienceSouhaitee: '',
            certificationsDemandees: [],
            langue: '',
            remuneration: '',
            isActive: true
        };

        if (offer) {
            setFormData({
                ...initialFormData, // Start with defaults
                ...offer, // Overlay with offer data
                // Ensure array fields are initialized correctly if null/undefined in offer
                competencesTechniquesRequises: offer.competencesTechniquesRequises || [],
                competencesComportementalesRequises: offer.competencesComportementalesRequises || [],
                certificationsDemandees: offer.certificationsDemandees || [],
                isActive: offer.isActive !== undefined ? offer.isActive : true,
                entrepriseId: offer.entrepriseId || null // Retain existing entrepriseId if editing
            });
        } else {
            // For new offer, if recruiter is intermediate and has only one entreprise, pre-select it.
            // Or if not intermediate but profile provides a default/single one.
            let defaultEntrepriseId = null;
            if (recruiterProfile && recruiterProfile.isIntermediateRecruiter && recruiterProfile.entreprises && recruiterProfile.entreprises.length === 1) {
                defaultEntrepriseId = recruiterProfile.entreprises[0].id;
            } else if (recruiterProfile && !recruiterProfile.isIntermediateRecruiter && recruiterProfile.entreprises && recruiterProfile.entreprises.length === 1) {
                // Scenario: Non-intermediate recruiter has their single company info in recruiterProfile.entreprises[0].id
                // Backend handles non-intermediate cases usually, but if profile provides it, we can use it.
                 defaultEntrepriseId = recruiterProfile.entreprises[0].id; 
            }
            // If creating a new offer and no specific offer.entrepriseId, use default or null
            setFormData({...initialFormData, entrepriseId: defaultEntrepriseId }); 
        }
    }, [offer, recruiterProfile]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // For array fields like competences, certifications
    const handleArrayChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value.split(',').map(item => item.trim()).filter(item => item)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (recruiterProfile && recruiterProfile.isIntermediateRecruiter && !formData.entrepriseId) {
            setError('Please select an entreprise for the job offer.');
            setIsSubmitting(false);
            return;
        }

        const submissionData = {
            ...formData,
            competencesTechniquesRequises: Array.isArray(formData.competencesTechniquesRequises) ? formData.competencesTechniquesRequises : [],
            competencesComportementalesRequises: Array.isArray(formData.competencesComportementalesRequises) ? formData.competencesComportementalesRequises : [],
            certificationsDemandees: Array.isArray(formData.certificationsDemandees) ? formData.certificationsDemandees : [],
        };

        if (submissionData.entrepriseId === null) {
            delete submissionData.entrepriseId;
        }

        try {
            const url = offer ? `/api/job-offers/${offer.id}` : '/api/job-offers';
            const method = offer ? 'put' : 'post'; // Axios methods are lowercase

            // Use axios with withCredentials: true
            await axios[method](url, submissionData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            onSave();

        } catch (err) {
            console.error("Failed to save job offer:", err);
            let errorMessage = 'Failed to save job offer.';
            if (err.response && err.response.data && err.response.data.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="job-offer-form-modal-overlay">
            <div className="job-offer-form-modal">
                <form onSubmit={handleSubmit}>
                    <h3>{offer ? 'Edit Job Offer' : 'Create New Job Offer'}</h3>
                    
                    <div className="form-group">
                        <label htmlFor="titrePoste">Job Title *</label>
                        <input type="text" id="titrePoste" name="titrePoste" value={formData.titrePoste} onChange={handleChange} required />
                    </div>

                    {recruiterProfile && recruiterProfile.isIntermediateRecruiter && recruiterProfile.entreprises && recruiterProfile.entreprises.length > 0 && (
                        <div className="form-group">
                            <label htmlFor="entrepriseId">Entreprise *</label>
                            <select 
                                id="entrepriseId" 
                                name="entrepriseId" 
                                value={formData.entrepriseId || ''} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="" disabled>Select an entreprise</option>
                                {recruiterProfile.entreprises.map(entreprise => (
                                    <option key={entreprise.id} value={entreprise.id}>{entreprise.nom}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="localisation">Location *</label>
                        <input type="text" id="localisation" name="localisation" value={formData.localisation} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="descriptionDetaillee">Detailed Description *</label>
                        <textarea id="descriptionDetaillee" name="descriptionDetaillee" value={formData.descriptionDetaillee} onChange={handleChange} rows="5" required></textarea>
                    </div>

                    <div className="form-group">
                        <label htmlFor="competencesTechniquesRequises">Technical Skills (comma-separated)</label>
                        <input type="text" id="competencesTechniquesRequises" name="competencesTechniquesRequises" 
                               value={formData.competencesTechniquesRequises.join(', ')} 
                               onChange={(e) => handleArrayChange('competencesTechniquesRequises', e.target.value)} />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="competencesComportementalesRequises">Soft Skills (comma-separated)</label>
                        <input type="text" id="competencesComportementalesRequises" name="competencesComportementalesRequises" 
                               value={formData.competencesComportementalesRequises.join(', ')} 
                               onChange={(e) => handleArrayChange('competencesComportementalesRequises', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="education">Education</label>
                        <input type="text" id="education" name="education" value={formData.education} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="typeContrat">Contract Type *</label>
                        <select id="typeContrat" name="typeContrat" value={formData.typeContrat} onChange={handleChange} required>
                            {Object.values(ContractType).map(type => (
                                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="dureeContrat">Contract Duration (if applicable)</label>
                        <input type="text" id="dureeContrat" name="dureeContrat" value={formData.dureeContrat} onChange={handleChange} />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="typeModalite">Work Modality *</label>
                        <select id="typeModalite" name="typeModalite" value={formData.typeModalite} onChange={handleChange} required>
                            {Object.values(OfferModality).map(modality => (
                                <option key={modality} value={modality}>{modality.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="experienceSouhaitee">Experience Required</label>
                        <input type="text" id="experienceSouhaitee" name="experienceSouhaitee" value={formData.experienceSouhaitee} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="certificationsDemandees">Certifications (comma-separated)</label>
                        <input type="text" id="certificationsDemandees" name="certificationsDemandees" 
                               value={formData.certificationsDemandees.join(', ')} 
                               onChange={(e) => handleArrayChange('certificationsDemandees', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="langue">Language</label>
                        <input type="text" id="langue" name="langue" value={formData.langue} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="remuneration">Remuneration</label>
                        <input type="text" id="remuneration" name="remuneration" value={formData.remuneration} onChange={handleChange} />
                    </div>

                    <div className="form-group form-group-checkbox">
                        <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} />
                        <label htmlFor="isActive">Is Active</label>
                    </div>
                    
                    {error && <p className="error-message">{error}</p>}

                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
                            Close
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (offer ? 'Update Offer' : 'Create Offer')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobOfferForm; 