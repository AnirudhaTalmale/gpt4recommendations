import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';

function OnboardingPage() {
    const [searchParams] = useSearchParams();
    
    const fullName = decodeURIComponent(searchParams.get('displayName') || '');
    const firstName = fullName.split(' ')[0]; 
    
    const [displayName, setDisplayName] = useState(firstName);
    const [country, setCountry] = useState(''); 
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
                country
            }, { withCredentials: true });
            
            if (response.data.success) {
                navigate(response.data.redirectTo);
            }
        } catch (error) {
            console.error('Onboarding error:', error.response?.data || error.message);
        }
    }, [token, displayName, country, navigate]); // Dependencies

    useEffect(() => {
        const tokenQueryParam = searchParams.get('token');
        const hasDisplayName = searchParams.get('hasDisplayName') === 'true';
        const hasCountry = searchParams.get('hasCountry') === 'true';
        
        if (tokenQueryParam) {
            setToken(tokenQueryParam);

            if (hasDisplayName && hasCountry) {
                handleOnboardingSubmit(new Event('auto-submit'));
            }
        }
    }, [searchParams, navigate, handleOnboardingSubmit]); 

    
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
                <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required 
                >
                    <option value="" disabled>Select your country</option>
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                </select>
                <button type="submit">Continue</button>
            </form>
        </div>
    );
}

export default OnboardingPage;



