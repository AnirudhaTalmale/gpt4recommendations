import React from 'react';
import '../App.css'; // Assuming you want to use styles from App.css

function LoginPage() {
  const handleLogin = () => {
    // Redirect to Google OAuth or your authentication page
    // console.log("Redirect to Google OAuth or your authentication page");
    window.location.href = 'http://localhost:3000/auth/google?prompt=select_account';
  };

  return (
    <div className="login-container">
      <button onClick={handleLogin} className="login-button">
        Login with Google
      </button>
    </div>
  );
}

export default LoginPage;
