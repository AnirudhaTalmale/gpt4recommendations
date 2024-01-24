import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; 

function HomePage() {
  let navigate = useNavigate();

  const handleLogin = () => {
    navigate('/auth/login'); // This will take the user to the LoginPage with login methods
  };

  const handleSignup = () => {
    navigate('/auth/signup'); // This will take the user to the SignupPage
  };

  return (
    <div className="home-page-container">
      <h1>ChatGPT</h1>
      <div className="login-signup-container">
        <button onClick={handleLogin} className="login-signup-button">
          Log in
        </button>
        <button onClick={handleSignup} className="login-signup-button">
          Sign up
        </button>
      </div>
    </div>
  );
}

export default HomePage;
