import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chat from './components/Chat'; 
import LoginPage from './components/LoginPage';
import './App.css'; 

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/" element={<Chat />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
