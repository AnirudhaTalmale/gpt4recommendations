import React, { forwardRef } from 'react';
import '../App.css'; // Ensure your CSS file is correctly linked

const UpgradePlanModal = forwardRef(({ isOpen, onClose, userCountry }, ref) => {
    if (!isOpen || !userCountry) return null;

    let pricing;
    let currency; // Variable to hold the currency symbol and code
    switch (userCountry) {
    case 'India':
        pricing = '₹9';
        currency = '₹';
        break;
    case 'United States':
        pricing = '$0.11';
        currency = '$';
        break;
    default:
        return null;  // Optionally, return null if the country is not one of the expected ones
    }

    return (
        <div className="upgrade-modal">
        <div className="upgrade-modal-content" ref={ref}>
            <div className="modal-header">
            <h3 className="modal-heading">Upgrade Your Plan</h3>
            <button onClick={onClose} className="close-button"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="plans-container">
            <div className="upgrade-plan-option">
                <h3>Free</h3>
                <p className="upgrade-amount">{currency}0/month</p> 
                <button className="current-plan-button">Your current plan</button>
                <ul className="features-list">
                <li><i className="fa-solid fa-check"></i> 5 messages per 3 hours</li>
                </ul>
            </div>
            <div className="upgrade-plan-option plus">
                <h3>Plus</h3>
                <p className="upgrade-amount">{pricing}/month</p>
                <button className="upgrade-button">Upgrade to Plus</button>
                <ul className="features-list">
                <li><i className="fa-solid fa-check"></i> 35 messages per 3 hours</li>
                </ul>
            </div>
            </div>
        </div>
        </div>
    );
});

export default UpgradePlanModal;
