import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

function EmailVerificationPage() {
    const location = useLocation();
    const emailToBeVerified = location.state?.emailToBeVerified;
    const [emailResent, setEmailResent] = useState(false);
    const [countdown, setCountdown] = useState(30); // Countdown state

    const resendVerificationEmail = async () => {
        try {
            await axios.post('http://localhost:3000/send-verification-email', { email: emailToBeVerified });
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
        <div className="centered-container">
            <div className="verification-message">
                <h2>Verify your email</h2>
                <p>We sent an email to <strong>{emailToBeVerified}</strong>. Click the link inside to get started.</p>
                {!emailResent ? (
                    <button onClick={resendVerificationEmail} className="resend-email-button">
                        Resend email
                    </button>
                ) : (
                    <div className="email-sent-confirmation">
                        Email sent. You can resend in {countdown} seconds.
                    </div>
                )}
            </div>
        </div>
    );
}

export default EmailVerificationPage;
