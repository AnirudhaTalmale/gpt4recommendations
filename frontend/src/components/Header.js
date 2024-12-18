import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Header({ togglePane, setCurrentSessionId, onStopStreaming, currentSessionIdRef }) {
  const navigate = useNavigate();

  const onNewSession = async () => {
    navigate(`/`);
    setCurrentSessionId(null);
    currentSessionIdRef.current = null;
    onStopStreaming();
  };

  return (
    <div className="header">
        <>
          <button className="menu-button-small-screen" onClick={togglePane}>
            <i className="fa-solid fa-bars"></i>
          </button>

          {/* {shouldDisplayCountrySelect && (
            <select className="country-select" value={country} onChange={handleCountryChange}>
              <option value="Canada">Canada</option>
              <option value="France">France</option>
              <option value="Germany">Germany</option>
              <option value="India">India</option>
              <option value="Japan">Japan</option>
              <option value="Netherlands">Netherlands</option>
              <option value="Sweden">Sweden</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="United States">United States</option>
            </select>
          )} */}

          <button className="new-session-button-small-screen" onClick={onNewSession}>
            <i class="fa-solid fa-house"></i>
          </button>
        </>
     
    </div>
  );
}

export default Header;
