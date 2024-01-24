import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';

function OnboardingPage() {
    const [displayName, setDisplayName] = useState('');
    const [birthday, setBirthday] = useState('');
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const tokenQueryParam = searchParams.get('token');
        if (tokenQueryParam) {
            setToken(tokenQueryParam);
        }
    }, [searchParams]);

    const handleOnboardingSubmit = async (event) => {
        event.preventDefault();

        if (!token) {
            console.error('No token provided for onboarding.');
            return;
        }
        try {
            const response = await axios.post('http://localhost:3000/api/onboarding', {
                token,
                displayName,
                birthday,
            }, { withCredentials: true });
            
            if (response.data.success) {
                // Redirect to the chat page
                navigate(response.data.redirectTo);
            }
        } catch (error) {
            console.error('Onboarding error:', error.response?.data || error.message);
            // Handle errors, possibly display a message to the user
        }
    };

    const handleBirthdayChange = (e) => {
        let value = e.target.value;
    
        // Remove any non-digit characters
        const numbers = value.replace(/[^\d]/g, '');
    
        // Automatically add first slash after the second digit
        if (numbers.length === 2) {
            value = `${numbers}/`;
        }
        // Add second slash after the fourth digit
        else if (numbers.length === 4) {
            value = `${numbers.slice(0, 2)}/${numbers.slice(2)}/`;
        }
    
        setBirthday(value);
    };
    
    
    return (
        <div className="onboarding-container">
        <h1>Tell us about you</h1>
        <form onSubmit={handleOnboardingSubmit}>
            <input
                type="text"
                placeholder="Full name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Birthday (DD/MM/YYYY)"
                value={birthday}
                onChange={handleBirthdayChange}
            />
            <button type="submit">Continue</button>
        </form>
        </div>
    );
}

export default OnboardingPage;
