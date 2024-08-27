import React from 'react';
import HomePageHeader from './HomePageHeader';
import Footer from './Footer';
import '../App.css';  // Ensure this CSS file is correctly linked and loaded

const Contact = () => {
    return (
        <div className="entire-contact-us-page">
            <HomePageHeader />
            <div className="contact-container">
                <h2>Contact Us</h2>
                <p>If you have any questions, suggestions, or need assistance, please don't hesitate to reach out to us. We're here to assist you every step of the way.</p>
                <p>You can contact us via email at <a href="mailto:contact@getbooks.ai">contact@getbooks.ai</a>. We strive to respond to all inquiries as promptly as possible.</p>
                <p>At GetBooks.ai, we value your feedback and are committed to improving our services based on your needs. Let us know how we can better serve you and enhance your experience with our platform.</p>
            </div>
            <Footer />
        </div>
    );
};

export default Contact;
