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
    const [isOpen, setIsOpen] = useState(false);
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

    useEffect(() => {
        function handleClickOutside(event) {
            if (isOpen && !event.target.closest('.dropdown')) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const toggleDropdown = () => setIsOpen(!isOpen);

    
    return (
        <div className="onboarding-container">
            <h1>Tell us about you</h1>
            <form onSubmit={handleOnboardingSubmit}>
                <input
                    type="text"
                    placeholder="User name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                />
                <div className="dropdown">
                    <div className={`dropdown-button ${isOpen ? 'active' : ''}`} onClick={toggleDropdown} tabIndex="0">
                        {country || "Select your country"}
                    </div>
                    {isOpen && (
                        <ul className="dropdown-list">
                        <li onClick={() => { setCountry('Canada'); setIsOpen(false); }}>Canada</li>
                        <li onClick={() => { setCountry('France'); setIsOpen(false); }}>France</li>
                        <li onClick={() => { setCountry('Germany'); setIsOpen(false); }}>Germany</li>
                        <li onClick={() => { setCountry('India'); setIsOpen(false); }}>India</li>
                        <li onClick={() => { setCountry('Japan'); setIsOpen(false); }}>Japan</li>
                        <li onClick={() => { setCountry('Netherlands'); setIsOpen(false); }}>Netherlands</li>
                        <li onClick={() => { setCountry('Sweden'); setIsOpen(false); }}>Sweden</li>
                        <li onClick={() => { setCountry('United Kingdom'); setIsOpen(false); }}>United Kingdom</li>
                        <li onClick={() => { setCountry('United States'); setIsOpen(false); }}>United States</li>
                    </ul>                    
                    )}
                </div>
                <button type="submit">Continue</button>
            </form>
        </div>
    );
}

export default OnboardingPage;



