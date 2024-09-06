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
            console.log("emailToBeVerified is", emailToBeVerified);
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/verify-code`, {
                email: emailToBeVerified,
                code: verificationCode
            });
            if (response.data && response.data.redirectTo) {
                navigate(response.data.redirectTo); // navigate to either /chat or /onboarding?token=XYZ
            } else {
                console.error('Unexpected response structure:', response);
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
