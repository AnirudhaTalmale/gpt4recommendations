import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sampleQueries } from './queries'; // Imported here

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

  const handleLogin = () => {
    navigate('/auth/login');
  };

  const handleSignup = () => {
    navigate('/auth/signup');
  };

  return (
    <div className="home-page-wrapper">
      <div className="sample-prompts-container">
        <div className="animated-prompt">{sampleQueries[activePrompt]}</div> 
        {/* Use sampleQueries here */}
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
