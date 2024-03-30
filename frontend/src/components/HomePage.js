import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { sampleQueries } from './queries'; 
import axios from 'axios';
import '../App.css';

function HomePage() {
  let navigate = useNavigate();
  const [activePrompt, setActivePrompt] = useState(0);

  useEffect(() => {
    const updatePrompt = () => {
      setActivePrompt(prev => (prev + 1) % sampleQueries.length);
    };

    const intervalId = setInterval(updatePrompt, 4000); 
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Use sampleQueries.length here

  const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    const validateEmail = (email) => {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    };

    const handleLoginWithEmail = async (event) => { 
      event.preventDefault();
    
      if (email && validateEmail(email)) {
        setEmailError('');
        axios.post(`${process.env.REACT_APP_BACKEND_URL}/send-verification-email`, { email })
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
        window.location.href = `${process.env.REACT_APP_BACKEND_URL}/auth/google?prompt=select_account`;
    };

  return (
    <div className="home-page-wrapper">
      <div className="chatgpt-text">GetBooks</div>
      
      <div className="sample-prompts-container">
        <div className="animated-prompt">{sampleQueries[activePrompt]}</div> 
        {/* Use sampleQueries here */}
      </div>
      
      <div className="home-page-container">
      
        <div className="login-container">
            <strong className="login-prompt">Get started with GPT-4 powered book recommendation app</strong>

            <button onClick={handleSignupGoogle} className="login-button">
                <img src="/icons8-google-logo.svg" alt="" className="google-logo" />
                Continue with Google
            </button>
            
            <div className="divider">
                <span className="line"></span>
                OR
                <span className="line"></span>
            </div>

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

            <div className="footer-links">
              <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link> 
              <a href="/contact-us" className="footer-link">Contact us</a>
              <Link to="/blog" className="footer-link">Blog</Link>
            </div>
        </div>
        
      </div>
    </div>
  );
}

export default HomePage;