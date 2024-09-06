import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import HeaderWithBackButton from './HeaderWithBackButton';

function EmailVerificationPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const emailToBeVerified = location.state?.emailToBeVerified;
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationError, setVerificationError] = useState('');
    const [emailResent, setEmailResent] = useState(false);
    const [countdown, setCountdown] = useState(30);

    const handleVerifyAndSignIn = async () => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/verify-code`, {
                email: emailToBeVerified,
                code: verificationCode
            }, {
                withCredentials: true  // Ensures cookies, authorization headers, and TLS client certificates are sent with the request
            });
    
            // If the response indicates success
            if (response.data.success) {
                if (response.data.redirectTo) {
                    // If the user is fully onboarded, redirect to /chat
                    navigate(response.data.redirectTo);
                } else if (response.data.verificationToken) {
                    // If the user needs onboarding, use the verificationToken for onboarding
                    const onboardingResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/onboarding`, {
                        token: response.data.verificationToken
                    }, { withCredentials: true });

                    if (onboardingResponse.data.success) {
                        navigate(onboardingResponse.data.redirectTo);  // Redirect after onboarding
                    }
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 400) {
                setVerificationError('Incorrect verification code or token expired');
            } else {
                console.error('Error verifying code:', error);
                setVerificationError('Error verifying code. Please try again.');
            }
        }
    };
    
    

    const resendVerificationEmail = async () => {
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/send-verification-email`, { email: emailToBeVerified });
            setEmailResent(true);
            setCountdown(30); // Reset countdown
        } catch (error) {
            console.error('Error resending email:', error);
        }
    };

    useEffect(() => {
        let interval;
        if (emailResent && countdown > 0) {
            interval = setInterval(() => {
                setCountdown((currentCountdown) => currentCountdown - 1);
            }, 1000);
        } else if (countdown === 0) {
            setEmailResent(false);
        }
        return () => clearInterval(interval);
    }, [emailResent, countdown]);

    return (
        <div>
            <HeaderWithBackButton />
            <div className="centered-container">
                <div className="verification-message">
                    <h2>Verify Your Email</h2>
                    <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Verification Code"
                    />
                    {verificationError && (
                        <div className="error-message">{verificationError}</div>
                    )}
                    <button onClick={handleVerifyAndSignIn} disabled={!verificationCode}>
                        Sign In
                    </button>
                    {!emailResent ? (
                        <button onClick={resendVerificationEmail} className="resend-email-button">
                            Resend Email
                        </button>
                    ) : (
                        <div className="email-sent-confirmation">
                            Email sent. You can resend in {countdown} seconds.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EmailVerificationPage;
