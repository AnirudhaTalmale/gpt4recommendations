import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function LoginPage() {
    const [isEmailEntered, setIsEmailEntered] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(false);
    const [emailInputError, setEmailInputError] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [showPassword, setShowPassword] = useState(false); 
    const [isEmailVerified, setIsEmailVerified] = useState(true);
    const [emailToBeVerified, setEmailToBeVerified] = useState('');
    const [emailResent, setEmailResent] = useState(false);

    const resendVerificationEmail = async () => {
      try {
          console.log("Resending verification email to: ", emailToBeVerified);
          await axios.post('http://localhost:3000/resend-email', { email: emailToBeVerified });
          setEmailResent(true);
          setTimeout(() => setEmailResent(false), 30000); // Hide the message and show the button after 30 seconds
      } catch (error) {
          console.error('Error resending email:', error);
          // Optionally handle error state here
      }
  };
  

    const navigate = useNavigate();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const validateEmail = (email) => {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    };

    const handleEditEmailClick = (event) => {
        event.preventDefault();
        setIsEmailEntered(false);
        setLoginError(false); // Reset the user exists error when editing the email
    };

    const handleLoginWithEmail = async (event) => {
      event.preventDefault();
      setLoginError(false); // Reset the error state before the login attempt
    
      // First, check if the email has been entered and is valid.
      if (email && !isEmailEntered) {
        if (validateEmail(email)) {
          setIsEmailEntered(true); // Allow the user to enter the password next
          setEmailError(''); // Clear any previous error messages
          setEmailInputError(false); // Reset the email input error state
        } else {
          setEmailError('Email is not valid');
          setEmailInputError(true); // Set email input error state
        }
      } else if (email && isEmailEntered && password) {
        // If both email and password have been entered, attempt to login.
        try {
          const response = await axios.post('http://localhost:3000/login', { email, password });
          // Redirect to chat component logic should be here
          if (response.data) {
            navigate('/chat');
          }
        } catch (error) {
          if (error.response && error.response.status === 403) {
            // Handle email not verified error
            setIsEmailVerified(false);
            setEmailToBeVerified(email);
            setPassword('');
            setEmailInputError(true);

          } else if (error.response && (error.response.status === 400 || error.response.status === 401)) {
            // Handle wrong email or password error
            setLoginError(true); // Use this state to show "Wrong email or password" message
            setPassword(''); // Reset the password input box
            setEmailInputError(true);
            
          } else {
            console.error('Login error:', error.response?.data || error.message);
          }
        }
      }
    };    

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    };

    const handlePasswordChange = (event) => {
        const pass = event.target.value;
        setPassword(pass);
    };

    const handleSignupGoogle = () => {
        window.location.href = 'http://localhost:3000/auth/google?prompt=select_account';
    };

    const handleSignupMicrosoft = () => {
        window.location.href = 'http://localhost:3000/auth/microsoft';
    };

    const handleSignupApple = () => {
        console.log('Signup with Apple initiated');
    };

    return (
      <div className="login-container">
          {!isEmailVerified ? (
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
                            Email sent.
                        </div>
                    )}
                </div>
              </div>
          ) : (
              <>
                  <h2>Welcome back</h2>
                  <form onSubmit={handleLoginWithEmail} noValidate>
                      <div className="email-input-group">
                          <input
                              type="email"
                              id="email"
                              placeholder="Email address"
                              required
                              className={`email-input ${emailInputError ? 'input-error' : ''}`}
                              value={email}
                              onChange={handleEmailChange}
                              readOnly={isEmailEntered}
                          />
                          {isEmailEntered && (
                              <button type="button" onClick={handleEditEmailClick} className="edit-email-button">Edit</button>
                          )}
                      </div>
                      {emailError && (
                          <div className="error-message">{emailError}</div>
                      )}
                      {isEmailEntered && (
                          <>
                              <div className="password-input-group">
                                  <input
                                      type={showPassword ? 'text' : 'password'}
                                      id="password"
                                      placeholder="Password"
                                      required
                                      className={`email-input ${loginError ? 'input-error' : ''}`}
                                      value={password}
                                      onChange={handlePasswordChange}
                                  />
                                  <button type="button" onClick={togglePasswordVisibility} className="toggle-password">
                                      {showPassword ? 'Hide' : 'Show'}
                                  </button>
                              </div>
                              {loginError && (
                                  <div className="error-message">Wrong email or password</div>
                              )}
                          </>
                      )}
                      <button type="submit" className="continue-button">
                          Continue
                      </button>
                  </form>
                  <p className="login-prompt">Don't have an account? <a href="/auth/signup" className="login-link">Sign up</a></p>
                  {!isEmailEntered && (
                      <>
                          <div className="divider">
                              <span className="line"></span>
                              OR
                              <span className="line"></span>
                          </div>
                          <button onClick={handleSignupGoogle} className="login-button">
                              <img src="/icons8-google-logo.svg" alt="" className="google-logo" />
                              Continue with Google
                          </button>
                          <button onClick={handleSignupMicrosoft} className="login-button">
                              <img src="/microsoft-svgrepo-com.svg" alt="" className="microsoft-logo" />
                              Continue with Microsoft
                          </button>
                          <button onClick={handleSignupApple} className="login-button">
                              <img src="/apple-seeklogo.svg" alt="" className="apple-logo" />
                              Continue with Apple
                          </button>
                      </>
                  )}
              </>
          )}
      </div>
  );
  
}

export default LoginPage;