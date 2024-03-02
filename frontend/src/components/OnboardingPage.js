import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';

function OnboardingPage() {
    const [displayName, setDisplayName] = useState('');
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState('');
    const navigate = useNavigate();

    const handleOnboardingSubmit = useCallback(async (event) => {
        event.preventDefault();
        if (!token) {
            console.error('No token provided for onboarding.');
            return;
        }
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/onboarding`, {
                token,
                displayName,
            }, { withCredentials: true });
            
            if (response.data.success) {
                navigate(response.data.redirectTo);
            }
        } catch (error) {
            console.error('Onboarding error:', error.response?.data || error.message);
        }
    }, [token, displayName, navigate]); // Dependencies

    useEffect(() => {
        const tokenQueryParam = searchParams.get('token');
        const hasDisplayName = searchParams.get('hasDisplayName') === 'true';
        
        if (tokenQueryParam) {
            setToken(tokenQueryParam);

            if (hasDisplayName) {
                handleOnboardingSubmit(new Event('auto-submit'));
            }
        }
    }, [searchParams, navigate, handleOnboardingSubmit]); // Updated dependencies

    
    return (
        <div className="onboarding-container">
        <h1>Tell us about you</h1>
        <form onSubmit={handleOnboardingSubmit}>
            <input
                type="text"
                placeholder="User name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
            />
            <button type="submit">Continue</button>
        </form>
        </div>
    );
}

export default OnboardingPage;



