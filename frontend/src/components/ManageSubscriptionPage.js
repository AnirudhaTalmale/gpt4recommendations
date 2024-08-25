import React from 'react';
import HomePageHeader from './HomePageHeader';
import Footer from './Footer';
import '../App.css'; // Make sure the CSS is correctly linked

const ManageSubscriptionPage = () => {
    return (
        <>
        <HomePageHeader />
        
        <div className="manage-subscription-page">
            
            <h1>Manage Your Subscription</h1>
            <p>Follow these steps to manage your subscription:</p>
            <ol>
                <li>Log in to your PayPal account.</li>
                <li>Navigate to Settings by clicking the gear icon.</li>
                <li>Access the Payments section.</li>
                <li>Click on Manage Automatic Payments.</li>
                <li>Select GetBooks.ai from your list of merchants.</li>
                <li>Here, you can:
                    <ul>
                        <li>Cancel your subscription.</li>
                        <li>Update your payment method.</li>
                        <li>View payment history.</li>
                    </ul>
                </li>
            </ol>
            <h2>Renewing Your Subscription</h2>
            <p>After your current subscription period ends, you can renew by starting a new subscription on <a href="https://getbooks.ai">GetBooks.ai</a></p>
        </div>
        <Footer />
        </>
    );
}

export default ManageSubscriptionPage;
