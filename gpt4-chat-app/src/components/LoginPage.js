import React from 'react';
import '../App.css'; // Assuming you want to use styles from App.css

function LoginPage() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google?prompt=select_account';
  };

  return (
    <div className="login-container">
      <button onClick={handleLogin} className="login-button">
        <img src="/icons8-google-logo.svg" alt="Google logo" className="google-logo" />
        Continue with Google
      </button>
    </div>
  );
}

export default LoginPage;

