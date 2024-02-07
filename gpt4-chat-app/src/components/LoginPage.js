import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    const validateEmail = (email) => {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    };

    const navigate = useNavigate();

    const handleLoginWithEmail = async (event) => {
      event.preventDefault();
    
      if (email && validateEmail(email)) {
        setEmailError('');
        axios.post('http://localhost:3000/send-verification-email', { email })
          .then(() => {
            navigate('/verify-email', { state: { emailToBeVerified: email } });
          })
          .catch(error => {
            if (error.response && error.response.status === 429) {
              const resetTime = new Date(error.response.data.resetTime);
              const formattedTime = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              setEmailError(`You already sent 8 emails in the last hour. Please try again after ${formattedTime}.`);
            } else {
              console.error('Error sending email:', error);
              setEmailError('Error sending verification email. Please try again.');
            }
          });
      } else {
        setEmailError('Email is not valid');
      }
    };
    
    const handleEmailChange = (event) => {
      const newEmail = event.target.value;
      setEmail(newEmail);
  
      // Clear the error message if the input is empty
      if (newEmail === '') {
          setEmailError('');
      }
    };
  

    const handleSignupGoogle = () => {
        window.location.href = 'http://localhost:3000/auth/google?prompt=select_account';
    };

    return (
        <div className="login-container">
            <h2>Welcome back</h2>
            <form onSubmit={handleLoginWithEmail} noValidate>
                <div className="email-input-group">
                    <input
                        type="email"
                        id="email"
                        placeholder="Email address"
                        required
                        className={`email-input ${emailError ? 'input-error' : ''}`}
                        value={email}
                        onChange={handleEmailChange}
                    />
                </div>
                {emailError && (
                    <div className="error-message">{emailError}</div>
                )}
                <button type="submit" className="continue-button">
                    Continue with Email
                </button>
            </form>

            <div className="divider">
                <span className="line"></span>
                OR
                <span className="line"></span>
            </div>
            <button onClick={handleSignupGoogle} className="login-button">
                <img src="/icons8-google-logo.svg" alt="" className="google-logo" />
                Continue with Google
            </button>
        </div>
    );
}

export default LoginPage;
