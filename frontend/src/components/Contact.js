import React, {useEffect} from 'react';
import HomePageHeader from './HomePageHeader'; 
import '../App.css';

const Contact = () => {

  useEffect(() => {
    // Create the script element
    const tawkScript = document.createElement('script');
    tawkScript.async = true;
    tawkScript.src = 'https://embed.tawk.to/65fed84aa0c6737bd123ec54/1hplr9hi9';
    tawkScript.setAttribute('crossorigin', '*');

    // Insert script in the document
    document.body.appendChild(tawkScript);

    // Remove the script when component unmounts
    return () => {
      document.body.removeChild(tawkScript);
    };
  }, []);

  return (
    <div className="contact-us-page">
     <HomePageHeader />
    
    <div className="contact-container">
      
      <h1>Contact Us</h1>
      <div className="contact-buttons-container">
        <p>
          <a href="mailto:getbooksai@gmail.com">
            <i className="fa-solid fa-envelope"></i> Mail
          </a>
        </p>
        <p>
        <button onClick={() => {
          if (window.Tawk_API) {
            window.Tawk_API.maximize();
          }
        }}>
          <i className="fa-solid fa-comments"></i> Chat
        </button>
        </p>
      </div>
    </div>

      <footer className="footer">
        <nav>
            <a href="/about-us">About Us</a><span>|</span>
            <a href="/blog">Blog</a><span>|</span>
            <a href="/privacy-policy">Privacy Policy</a><span>|</span>
            <a href="/contact-us">Contact Us</a>
        </nav>
      </footer>
    </div>
  );
};

export default Contact;
