import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './layout/Navbar'; // Import Navbar
import Sidebar from './layout/Sidebar'; // Import Sidebar
import RecruiterJobOffersView from './RecruiterJobOffersView'; // Import the new view
// import RecruiterCompaniesView from './RecruiterCompaniesView'; // No longer needed
import '../styles/AdminDashboard.css'; // Assuming this provides a good base layout style
// We might not need '../styles/RecruiterDashboard.css' if styles are in AdminDashboard.css or view-specific files

const RecruiterDashboard = () => {
    const navigate = useNavigate();
    const [recruiterProfile, setRecruiterProfile] = useState(null);
    // isLoadingAuth is for the validate-token call, isLoadingProfileDetails for the /me/profile call
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isLoadingProfileDetails, setIsLoadingProfileDetails] = useState(false); // Initially false, true only when fetching details
    const [profileError, setProfileError] = useState(null);
    // authDone signifies the end of the entire initial auth + profile fetch attempt sequence
    const [authDone, setAuthDone] = useState(false);

    // activeSection state is no longer needed if there's only one view
    // const [activeSection, setActiveSection] = useState('job-offers'); 
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const checkAuthAndRole = useCallback(async () => {
        setIsLoadingAuth(true);
        try {
            const response = await axios.get('/api/auth/validate-token', {
                withCredentials: true,
            });
            if (response.data.role !== 'RECRUTEUR') {
                console.warn('User is not a RECRUTEUR, redirecting.');
                navigate('/login');
                return null;
            }
            setRecruiterProfile(response.data); // Set basic profile from validate-token
            setIsLoadingAuth(false);
            return response.data;
        } catch (err) {
            console.error('Auth check failed:', err);
            navigate('/login');
            setIsLoadingAuth(false);
            setAuthDone(true); // If auth fails here, whole sequence is done.
            return null;
        }
    }, [navigate]);

    const fetchRecruiterProfileDetails = useCallback(async (authData) => {
        if (!authData || !authData.email) { // Ensure authData and email are present
             console.warn("Skipping profile details fetch: no authData or email");
             setAuthDone(true); // If no authData, the sequence is effectively done from a profile perspective.
             setIsLoadingProfileDetails(false); // Not loading if no auth data
             return; // No user to fetch details for
        }
        setIsLoadingProfileDetails(true);
        setProfileError(null);
        try {
            const response = await axios.get('/api/users/me/profile', {
                withCredentials: true,
            });
            setRecruiterProfile(response.data); // Update with detailed profile
        } catch (err) {
            console.error("Error fetching recruiter profile details:", err);
            setProfileError(err.message || 'Failed to fetch detailed recruiter profile');
            // Keep basic profile from validate-token if detail fetch fails
        } finally {
            setIsLoadingProfileDetails(false);
            setAuthDone(true); // Mark entire auth sequence as complete
        }
    }, [navigate]); // Removed recruiterProfile from dependency array

    useEffect(() => {
        const initAuth = async () => {
            const authData = await checkAuthAndRole(); // This sets isLoadingAuth to false
            if (authData) {
                await fetchRecruiterProfileDetails(authData); // This sets isLoadingProfileDetails to false and authDone to true
            } else {
                // If authData is null, checkAuthAndRole already set isLoadingAuth to false and authDone to true.
            }
        };
        initAuth();
    }, [checkAuthAndRole, fetchRecruiterProfileDetails]);

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };
    
    const handleLogout = async () => {
        try {
            await axios.post('/api/logout', {}, { withCredentials: true });
            setRecruiterProfile(null); // Clear profile on logout
            navigate('/login');
        } catch (error) {
            console.error('Logout failed', error);
            navigate('/login');
        }
    };

    // Combined loading state check
    if (isLoadingAuth || (!authDone && isLoadingProfileDetails)) {
        return <p>Loading recruiter dashboard...</p>;
    }

    if (!recruiterProfile) {
        // This should ideally only be hit if navigate('/login') is about to or has occurred.
        return <p>Redirecting to login...</p>; // Or null, if navigation is quick
    }
    
    // No need for ContentComponent logic if RecruiterJobOffersView is always shown

    return (
        <div className={`admin-dashboard${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}> 
            <Navbar 
                userRole={recruiterProfile.role} // Now we are sure recruiterProfile is not null here
                onToggleSidebar={toggleSidebar}
                sidebarCollapsed={sidebarCollapsed}
                onLogout={handleLogout}
            />
            <Sidebar 
                userRole={recruiterProfile.role} 
                activeSection={'job-offers'} // Only one section now
                setActiveSection={() => {}} // No longer needs to set active section from here for multiple views
                onToggleSidebar={toggleSidebar} 
                collapsed={sidebarCollapsed} 
            />
            <div className="main-content">
                {profileError && <p style={{color: 'red', textAlign: 'center'}}>Warning: Could not load full profile details: {profileError}</p>}
                <RecruiterJobOffersView recruiterProfile={recruiterProfile} />
            </div>
        </div>
    );
};

export default RecruiterDashboard; 