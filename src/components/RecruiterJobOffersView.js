import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Keep for potential navigation within this view
import axios from 'axios';
import JobOfferForm from './JobOfferForm';
import '../styles/RecruiterDashboard.css'; // Assuming styles are relevant
import '../styles/RecruiterJobOffersView.css'; // Import new CSS file

// Helper function to format date (optional)
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const RecruiterJobOffersView = ({ recruiterProfile }) => {
    const [jobOffers, setJobOffers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showOfferForm, setShowOfferForm] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const navigate = useNavigate(); // Keep for potential internal navigation or error handling

    const fetchJobOffers = useCallback(async () => {
        if (!recruiterProfile) return; // Don't fetch if profile is not available
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/job-offers/my-offers', {
                withCredentials: true,
            });
            setJobOffers(response.data);
        } catch (err) {
            console.error("Failed to fetch job offers:", err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                // Parent component (RecruiterDashboard) should handle overall auth. 
                // This view could set an error state specific to job offers.
                setError('Authentication error fetching job offers. Please try logging in again.');
                // navigate('/login'); // Avoid direct navigation from a sub-view if parent handles auth
            } else {
                setError(err.message || 'Failed to fetch job offers');
            }
        } finally {
            setIsLoading(false);
        }
    }, [recruiterProfile, navigate]); // Added navigate to dependency array

    useEffect(() => {
        fetchJobOffers();
    }, [fetchJobOffers]);

    const handleAddNewOffer = () => {
        setEditingOffer(null);
        setShowOfferForm(true);
    };

    const handleEditOffer = (offer) => {
        setEditingOffer(offer);
        setShowOfferForm(true);
    };

    const handleDeleteOffer = async (offerId) => {
        if (window.confirm('Are you sure you want to delete this job offer?')) {
            try {
                await axios.delete(`/api/job-offers/${offerId}`, {
                    withCredentials: true,
                });
                setJobOffers(jobOffers.filter(offer => offer.id !== offerId));
            } catch (err) {
                console.error("Failed to delete job offer:", err);
                setError(err.message || 'Failed to delete job offer');
                alert(`Error deleting offer: ${err.message || 'Unknown error'}`);
            }
        }
    };

    const handleToggleActive = async (offer) => {
        const updatedOfferData = {
            // Assuming your JobOfferDTO for updates takes all these fields.
            // Adjust if your backend expects only the 'isActive' field or a different DTO for partial updates.
            titrePoste: offer.titrePoste,
            entrepriseId: offer.entrepriseId, // This might be tricky if not readily available; DTO might need adjustment or service layer needs to handle it
            localisation: offer.localisation,
            descriptionDetaillee: offer.descriptionDetaillee, // This might be missing from the list view DTO, backend might need to fetch it
            competencesTechniquesRequises: offer.competencesTechniquesRequises || [],
            competencesComportementalesRequises: offer.competencesComportementalesRequises || [],
            education: offer.education,
            typeContrat: offer.typeContrat, // Ensure this is the enum KEY if backend expects enum
            dureeContrat: offer.dureeContrat,
            typeModalite: offer.typeModalite, // Ensure this is the enum KEY
            experienceSouhaitee: offer.experienceSouhaitee,
            certificationsDemandees: offer.certificationsDemandees || [],
            langue: offer.langue,
            remuneration: offer.remuneration,
            // Key change: toggle isActive status
            isActive: !offer.isActive 
        };

        // Note: The backend /api/job-offers/{offerId} PUT endpoint currently expects a full JobOfferDTO.
        // If it can't handle partial updates or if some fields are missing from the `offer` object here,
        // this will fail or update fields to null/undefined.
        // A dedicated endpoint like PATCH /api/job-offers/{offerId}/status might be better for just toggling active state.
        // For now, we'll attempt a PUT with available data. A robust solution would be to fetch the full offer before toggling status if DTOs differ.

        try {
            // We need a JobOfferDTO to update. The current 'offer' is a JobOfferResponseDTO.
            // This mapping is a placeholder and might be incomplete or incorrect.
            // The ideal way is to fetch the JobOffer entity or have a specific DTO for update that matches JobOfferDTO structure.
            // For simplicity, let's assume the backend is flexible or these fields are enough.
            // A more robust approach would be to fetch the full JobOffer for editing or have a PATCH endpoint.
            // For this example, we construct a DTO. This part needs careful review based on actual DTOs.
            const dtoForUpdate = {
                titrePoste: offer.titrePoste,
                // entrepriseId: offer.entrepriseId, // This is problematic. JobOfferResponseDTO has entrepriseNom.
                                                // The create/update DTO (JobOfferDTO) expects entrepriseId.
                                                // This will likely fail unless the backend logic for update is very forgiving
                                                // or doesn't require entrepriseId for an update if it's not changing.
                                                // For now, I will omit entrepriseId, assuming it's not changed.
                localisation: offer.localisation,
                descriptionDetaillee: offer.descriptionDetaillee || "N/A", // Assuming this exists or can be N/A
                competencesTechniquesRequises: offer.competencesTechniquesRequises || [],
                competencesComportementalesRequises: offer.competencesComportementalesRequises || [],
                education: offer.education || "N/A",
                typeContrat: offer.typeContrat, // Assuming this is already in the correct format (enum string)
                dureeContrat: offer.dureeContrat || "",
                typeModalite: offer.typeModalite, // Assuming this is already in the correct format (enum string)
                experienceSouhaitee: offer.experienceSouhaitee || "N/A",
                certificationsDemandees: offer.certificationsDemandees || [],
                langue: offer.langue || "N/A",
                remuneration: offer.remuneration || "",
                // The actual status toggle will be handled by the service if `isActive` is part of JobOfferDTO
                // However, JobOfferDTO doesn't have isActive. The service sets this.
                // This highlights the need for a dedicated endpoint or a different DTO for this operation.
            };
            
            // HACK/WORKAROUND: Since JobOfferDTO doesn't have 'isActive', and PUT expects a JobOfferDTO,
            // we can't directly tell the backend to toggle 'isActive' via the existing PUT /api/job-offers/{offerId}
            // A proper solution is a PATCH endpoint: PATCH /api/job-offers/{offerId}/toggle-active
            // For now, this button won't correctly update the active status through the current PUT endpoint
            // I will leave the frontend logic to update the state optimistically, but the backend won't reflect it.
            // To make this work, the backend updateJobOffer method or a new method would need to handle an 'isActive' field.

            // Placeholder for optimistic update - in a real scenario, wait for backend confirmation
            // setJobOffers(jobOffers.map(j => j.id === offer.id ? { ...j, isActive: !j.isActive } : j));
            // alert("Toggling active status requires backend changes to properly support this action via the current PUT endpoint. This is an optimistic UI update.");

            // To actually make it work without backend DTO changes, the service method updateJobOffer would need
            // to be aware of an 'isActive' field if we added it to JobOfferDTO.
            // Or, as mentioned, a new endpoint.

            // For the purpose of this example, let's assume we add 'isActive' to JobOfferDTO and the service handles it.
            // This is a significant assumption.
             const payload = { ...dtoForUpdate, isActive: !offer.isActive }; // This line is problematic if JobOfferDTO doesn't have isActive

            // Correct approach would be a dedicated endpoint.
            // Simulating a call to such an endpoint or an updated PUT
            // For now, let's just refresh to show the limitation.
            console.warn("Toggling active status: The current backend PUT /api/job-offers/{offerId} does not support updating 'isActive' directly via JobOfferDTO. A dedicated PATCH endpoint or DTO modification is needed. Refreshing offers.");
            await axios.put(`/api/job-offers/${offer.id}`, payload, { // THIS WILL LIKELY FAIL OR NOT WORK AS INTENDED
                 withCredentials: true,
            });
            fetchJobOffers(); // Re-fetch to get actual state from backend
        } catch (err) {
            console.error("Failed to toggle active status:", err);
            setError(err.message || 'Failed to toggle active status');
            alert(`Error toggling status: ${err.message || 'Unknown error'}`);
            // fetchJobOffers(); // Re-fetch to revert optimistic update if it was done
        }
    };

    const handleFormSave = () => {
        setShowOfferForm(false);
        setEditingOffer(null);
        fetchJobOffers(); // Refresh job offers list
    };

    const handleFormClose = () => {
        setShowOfferForm(false);
        setEditingOffer(null);
    };

    // Loading/error states specific to this view
    if (!recruiterProfile && !showOfferForm) {
        // This view expects recruiterProfile to be provided by the parent.
        // If it's not here, it might mean the parent is still loading it or auth failed.
        return <p>Recruiter profile not available for job offers view.</p>;
    }

    if (isLoading && !showOfferForm) { 
        return <p>Loading job offers...</p>;
    }

    if (error && !showOfferForm) {
        return <p>Error loading job offers: {error} <button onClick={fetchJobOffers}>Try Again</button></p>;
    }

    return (
        <div className="recruiter-job-offers-view">
            <div className="view-header">
                <h2>My Job Offers</h2>
                <button onClick={handleAddNewOffer} className="btn btn-primary">
                    <i className="fas fa-plus-circle"></i> Add New Offer
                </button>
            </div>
            
            {showOfferForm && recruiterProfile && (
                <JobOfferForm
                    offer={editingOffer}
                    onClose={handleFormClose}
                    onSave={handleFormSave}
                    recruiterProfile={recruiterProfile} 
                />
            )}

            {!showOfferForm && jobOffers.length === 0 && !isLoading && (
                <div className="no-offers-message">
                    <p>You have not posted any job offers yet.</p>
                    <p>Click "Add New Offer" to get started!</p>
                </div>
            )}
            {!showOfferForm && jobOffers.length > 0 && (
                <div className="job-offer-cards-container">
                    {jobOffers.map(offer => (
                        <div key={offer.id} className={`job-offer-card ${offer.isActive ? 'status-active' : 'status-inactive'}`}>
                            <div className="card-header">
                                <div className="company-logo">
                                    {offer.entrepriseLogoUrl ? 
                                        <img src={offer.entrepriseLogoUrl} alt={`${offer.entrepriseNom} logo`} /> : 
                                        <div className="logo-placeholder"><i className="fas fa-building"></i></div>
                                    }
                                </div>
                                <div className="offer-title-company">
                                    <h3>{offer.titrePoste}</h3>
                                    <p className="company-name">{offer.entrepriseNom || 'N/A'}</p>
                                </div>
                                <div className={`status-badge ${offer.isActive ? 'active' : 'inactive'}`}>
                                    {offer.isActive ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="offer-details">
                                    <p><i className="fas fa-map-marker-alt"></i> <strong>Location:</strong> {offer.localisation || 'N/A'}</p>
                                    <p><i className="fas fa-file-contract"></i> <strong>Contract:</strong> {offer.typeContrat || 'N/A'}</p>
                                    <p><i className="fas fa-desktop"></i> <strong>Modality:</strong> {offer.typeModalite || 'N/A'}</p>
                                </div>
                                {/* Add more details here if needed, e.g., description snippet */}
                            </div>
                            <div className="card-footer">
                                <div className="timestamps">
                                    <small>Created: {formatDate(offer.createdAt)}</small>
                                    <small>Updated: {formatDate(offer.updatedAt)}</small>
                                </div>
                                <div className="offer-actions">
                                    <button onClick={() => handleEditOffer(offer)} className="btn btn-icon btn-edit" title="Edit Offer">
                                        <i className="fas fa-edit"></i> Edit
                                    </button>
                                    {/* <button onClick={() => handleToggleActive(offer)} className={`btn btn-icon ${offer.isActive ? 'btn-deactivate' : 'btn-activate'}`} title={offer.isActive ? 'Deactivate Offer' : 'Activate Offer'}>
                                        {offer.isActive ? <><i className="fas fa-toggle-off"></i> Deactivate</> : <><i className="fas fa-toggle-on"></i> Activate</>}
                                    </button> */}
                                    {/* The toggle active button is commented out because the backend PUT /api/job-offers/{offerId}
                                        expects a JobOfferDTO which does not have an 'isActive' field.
                                        To implement this, the backend would need a PATCH endpoint (e.g., /api/job-offers/{id}/status)
                                        or the JobOfferDTO and the update service logic would need to be modified to accept 'isActive'.
                                        For now, the status is just displayed. If you have a way to update status (e.g. via the edit form), that's preferred.
                                    */}
                                    <button onClick={() => handleDeleteOffer(offer.id)} className="btn btn-icon btn-delete" title="Delete Offer">
                                        <i className="fas fa-trash-alt"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecruiterJobOffersView; 