import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css'; // Import the CSS if needed here, or ensure it's included globally

const Footer = () => (
  <footer className="footer">
    <nav>
      <Link to="/about-us">About Us</Link><span>|</span>
      <Link to="/blog">Blog</Link><span>|</span>
      <Link to="/privacy-policy">Privacy Policy</Link><span>|</span>
      <Link to="/contact-us">Contact Us</Link>
    </nav>
  </footer>
);

export default Footer;
