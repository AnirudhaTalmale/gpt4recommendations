import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import '../App.css';
import HomePageHeader from './HomePageHeader';
import Footer from './Footer';

function isEmbeddedWebView() {
  const userAgent = navigator.userAgent; // Directly using userAgent
  return /wv|WebView|FBAN|FBAV|Twitter|Instagram/i.test(userAgent);
}

const HomePage = () => {
  let navigate = useNavigate();
  const [inWebView, setInWebView] = useState(false);

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

    useEffect(() => {
      setInWebView(isEmbeddedWebView());
    }, []);
  
  return (
    <div className='homepage-parent-container'>
    <HomePageHeader></HomePageHeader>
    <div className="homepage">
      
      <section className="hero">
        <h2>Login to GetBooks.ai</h2>
          <div className="login-container">
            {!inWebView && (
              <>
              <button onClick={handleSignupGoogle} className="login-button">
                  <img src="/icons8-google-logo.svg" alt="" className="google-logo" />
                  Continue with Google
              </button>
            
            <div className="divider">
                <span className="line"></span>
                OR
                <span className="line"></span>
            </div>
            </>
            )}
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
          </div>
      </section>
    </div>
    <Footer></Footer>
    </div>
  );
};

export default HomePage;


    
