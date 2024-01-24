import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function HomePage() {
  let navigate = useNavigate();
  const prompts = [
    'Recommend a dish to impress a date',
    'Suggest a workout for beginners',
    'Plan a weekend getaway'
  ];

  const [activePrompt, setActivePrompt] = useState(0);

  useEffect(() => {
    // Function to update the prompt directly
    const updatePrompt = () => {
      setActivePrompt(prev => (prev + 1) % prompts.length);
    };
  
    // Start the interval
    const intervalId = setInterval(updatePrompt, 6000); // Change the interval as needed
  
    // Cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }, [prompts.length]); // Dependencies
  

  const handleLogin = () => {
    navigate('/auth/login');
  };

  const handleSignup = () => {
    navigate('/auth/signup');
  };

  return (
    <div className="home-page-wrapper">
      <div className="sample-prompts-container">
        <div className="animated-prompt">{prompts[activePrompt]}</div>
      </div>
      <div className="home-page-container">
        <h1>Get started</h1>
        <div className="login-signup-container">
          <button onClick={handleLogin} className="login-signup-button">
            Log in
          </button>
          <button onClick={handleSignup} className="login-signup-button">
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
  
}

export default HomePage;
