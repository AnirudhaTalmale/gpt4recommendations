import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';

function SignupPage() {
    const [isEmailEntered, setIsEmailEntered] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordValid, setPasswordValid] = useState(false);
    const [isSignUpComplete, setIsSignUpComplete] = useState(false); 
    const [userExistsError, setUserExistsError] = useState(false); 
    const [emailInputError, setEmailInputError] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [showPassword, setShowPassword] = useState(false); 
    const [emailSent, setEmailSent] = useState(false);

    const resendVerificationEmail = async () => {
        try {
            console.log("email is: ", email);
            await axios.post('http://localhost:3000/resend-email', { email });
            setEmailSent(true);
            setTimeout(() => setEmailSent(false), 30000); // Hide the message and show the button after 30 seconds
        } catch (error) {
            console.error('Error resending email:', error);
            // Optionally handle error state here
        }
    };

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
        setUserExistsError(false); // Reset the user exists error when editing the email
    };

    const handleSignupWithEmail = async (event) => {
        event.preventDefault();
        setUserExistsError(false); // Reset the error state before the signup attempt
        
        if (email && !isEmailEntered) {
            if (validateEmail(email)) {
                setIsEmailEntered(true);
                setEmailError(''); // Clear any previous error messages
                setEmailInputError(false); // Reset the email input error state
            } else {
                setEmailError('Email is not valid');
                setEmailInputError(true); // Set email input error state
            }
        } else if (email && isEmailEntered && passwordValid) {
            // Now attempt to sign up since both email and password have been entered.
            try {
                const response = await axios.post('http://localhost:3000/signup', { email, password });
                console.log(response.data);
                setIsSignUpComplete(true); // Set the flag to true upon successful signup
                // Additional logic upon successful signup (like redirecting)
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    setUserExistsError(true);
                    setEmailInputError(true); 
                } else {
                    console.error('Signup error:', error.response?.data || error.message);
                }
                // Handle other errors (e.g., show error message to user)
            }
        }
    };
    

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    };

    const handlePasswordChange = (event) => {
        const pass = event.target.value;
        setPassword(pass);
        validatePassword(pass);
    };

    const validatePassword = (pass) => {
        const isValid = pass.length >= 12;
        setPasswordValid(isValid);
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
            {isSignUpComplete ? (
                <div className="centered-container">
                    <div className="verification-message">
                        <h2>Verify your email</h2>
                        <p>We sent an email to <strong>{email}</strong>. Click the link inside to get started.</p>
                        {!emailSent ? (
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
                    <h2>Create your account</h2>
                    <form onSubmit={handleSignupWithEmail} noValidate>
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
                        {userExistsError && (
                            <div className="error-message">The user already exists.</div>
                        )}
                        {isEmailEntered && (
                            <>
                                <div className="password-input-group">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        placeholder="Password"
                                        required
                                        className={`email-input ${!passwordValid && password.length > 0 ? 'invalid-password' : ''}`}
                                        value={password}
                                        onChange={handlePasswordChange}
                                    />
                                    <button type="button" onClick={togglePasswordVisibility} className="toggle-password">
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                <div className="password-criteria">
                                    Your password must contain:
                                    <ul>
                                        <li className={password.length >= 12 ? "valid" : ""}>
                                            At least 12 characters
                                        </li>
                                    </ul>
                                </div>
                            </>
                        )}
                        <button type="submit" className="continue-button" disabled={isEmailEntered && !passwordValid}>
                            Continue
                        </button>
                    </form>
                    <p className="login-prompt">Already have an account? <a href="/auth/login" className="login-link">Log in</a></p>
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

export default SignupPage;
