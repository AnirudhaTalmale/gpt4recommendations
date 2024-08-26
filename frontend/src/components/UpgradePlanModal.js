import React, { forwardRef, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css'; 
import { toast } from 'react-toastify';
 
const UpgradePlanModal = forwardRef(({ isOpen, onClose, userCountry, userEmail }, ref) => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const navigate = useNavigate();
    const paypalContainerId = 'paypal-button-container-P-94A76765PN815393VM3D377A';

    // Memoized function to check subscription status
    const checkSubscriptionStatus = useCallback(async () => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/check-subscription`, { userEmail });
            if (response.data.isSubscribed !== undefined) {
                setIsSubscribed(response.data.isSubscribed);
            } else {
                console.error('Failed to retrieve subscription status:', response.data.message);
            }
        } catch (error) {
            console.error('Error checking subscription status:', error);
        } 
    }, [userEmail]);
      
    // Function to render PayPal button
    const renderPayPalButton = useCallback(() => {
        if (!isSubscribed && window.paypal && document.getElementById(paypalContainerId)) {
            window.paypal.Buttons({
                style: {
                    shape: 'pill',
                    color: 'gold',
                    layout: 'horizontal',
                    label: 'paypal'
                },
                createSubscription: function(data, actions) {
                    return actions.subscription.create({
                        plan_id: 'P-94A76765PN815393VM3D377A'
                    });
                },
                onApprove: function(data, actions) {
                    axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/store-subscription`, {
                        userEmail: userEmail,
                        subscriptionID: data.subscriptionID
                    })
                    .then(response => {
                        if (response.data.success) {
                            console.log('Subscription ID stored successfully.');
                            onClose();
                            toast.success('🎉 Your plan has been upgraded successfully!', {
                                position: "top-right",
                                autoClose: 5000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: "colored"
                            });
                        } else {
                            console.error('Failed to store subscription ID:', response.data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error storing subscription ID:', error);
                    });
                }
            }).render(`#${paypalContainerId}`);
        }
    }, [isSubscribed, userEmail, onClose]);

    // Effect to render PayPal button once modal opens and isSubscribed state is stable
    useEffect(() => {
        if (isOpen) {
            checkSubscriptionStatus();
            renderPayPalButton();
        }

        // Cleanup function to remove PayPal button if it exists
        return () => {
            const btnContainer = document.getElementById(paypalContainerId);
            if (btnContainer) {
                btnContainer.innerHTML = ''; // Clears the container to prevent duplication
            }
        };
    }, [isOpen, isSubscribed, checkSubscriptionStatus, renderPayPalButton]);

    // Function to handle navigation to Manage Subscription page
    const handleManageSubscription = () => {
        navigate('/manage-subscription'); // Navigate to the manage subscription route
    };
    
    if (!isOpen || !userCountry) return null;

    return (
        <div className="upgrade-modal">
            <div className="upgrade-modal-content" ref={ref}>
                <div className="modal-header">
                    <h3 className="modal-heading">Upgrade Your Plan</h3>
                    <button onClick={onClose} className="close-button"><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="plans-container">
                    <div className="upgrade-plan-option plus">
                        <h3>Plus</h3>
                        <p className="upgrade-amount">USD $2/month</p>
                        {!isSubscribed ?
                            <div id={paypalContainerId}></div> :
                            <button className="upgrade-button" onClick={handleManageSubscription}>
                                Manage Subscription
                            </button>
                        }
                        <ul className="features-list">
                            <li><i className="fa-solid fa-check"></i> 30 messages per 3 hours</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default UpgradePlanModal;




// import React, { forwardRef, useState, useEffect } from 'react';
// import axios from 'axios'; // Ensure axios is imported
// import '../App.css'; // Ensure your CSS file is correctly linked
// import ConfirmationDialog from './ConfirmationDialog';
// import moment from 'moment-timezone'; 


// const UpgradePlanModal = forwardRef(({ isOpen, onClose, userCountry, userEmail, userName, isSubscribed: propIsSubscribed, subscriptionId }, ref) => {
//     const [loading, setLoading] = useState(false);
//     const [isConfirmOpen, setIsConfirmOpen] = useState(false);
//     const [subscriptionStatus, setSubscriptionStatus] = useState('active'); // Default to 'active'
//     const [isSubscribed, setIsSubscribed] = useState(propIsSubscribed);
//     const [currentEndDate, setCurrentEndDate] = useState('');
//     const [transactionHistory, setTransactionHistory] = useState([]);
    
//     useEffect(() => {
//         const fetchSubscriptionStatus = async () => {
//             if (!subscriptionId) return;
//             setLoading(true);
//             try {
//                 const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/subscription-status`, {
//                     params: { subscriptionId }
//                 });
//                 setSubscriptionStatus(response.data.status);
    
//                 const zone = userCountry === 'India' ? 'Asia/Kolkata' : 'America/New_York';
//                 const formattedDate = moment.unix(response.data.current_end).tz(zone).format('MMMM DD, YYYY');
//                 setCurrentEndDate(formattedDate);

//                 const historyResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/subscription-history`, {
//                     params: { subscriptionId, userCountry }
//                 });

//                 setTransactionHistory(historyResponse.data.history);

//             } catch (error) {
//                 console.error('Error fetching subscription status or history:', error);
//             }
//             setLoading(false);
//         };
    
//         if (isOpen) {
//             fetchSubscriptionStatus();
//         }
//     }, [isOpen, subscriptionId, userCountry]);
    

//     if (!isOpen || !userCountry) return null;

//     let pricing;
//     let currency;
//     let planId;
//     let totalCount; // Declare totalCount here

//     switch (userCountry) {
//         case 'India':
//             pricing = '₹29';
//             currency = '₹';
//             planId = process.env.REACT_APP_RAZORPAY_PLAN_ID_INDIA;
//             totalCount = 60;
//             break;
//         case 'United States':
//             pricing = '$0.35';
//             currency = '$';
//             planId = process.env.REACT_APP_RAZORPAY_PLAN_ID_US;
//             totalCount = 60;
//             break;
//         default:
//             return null; 
//     }

//     const handlePayment = async () => {
//         setLoading(true);
//         try {
//             const subscriptionResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/create-subscription`, {
//                 plan_id: planId,
//                 total_count: totalCount,
//                 userEmail: userEmail
//             });

//             if (subscriptionResponse.data.subscriptionId) { // Correct key for subscription ID
//                 const razorpayOptions = {
//                     "key": process.env.REACT_APP_RAZORPAY_KEY_ID,
//                     "subscription_id": subscriptionResponse.data.subscriptionId,
//                     "name": "GetBooks.ai",
//                     "description": "Upgrade to Plus",
//                     "image": "/GetBooks_512_512.png",
//                     "handler": function(response) {
//                         axios.post(`${process.env.REACT_APP_BACKEND_URL}/verify-payment`, {
//                             razorpay_payment_id: response.razorpay_payment_id,
//                             server_razorpay_subscription_id: subscriptionResponse.data.subscriptionId,
//                             razorpay_signature: response.razorpay_signature,
//                             userEmail: userEmail
//                         })
//                         .then((verificationResponse) => {
//                             if (verificationResponse.data.status === "success") {
//                                 alert("Payment verified and subscription activated!");
//                                 setIsSubscribed(true);
//                             } else {
//                                 alert("Payment verification failed. Please contact support.");
//                             }
//                             setLoading(false);
//                         })
//                         .catch((error) => {
//                             console.error('Payment verification failed:', error);
//                             alert("Payment verification failed. Please try again.");
//                             setLoading(false);
//                         });
//                     },                    
//                     "prefill": {
//                         "email": userEmail
//                     },
//                     "theme": {
//                         "color": "#F37254"
//                     }
//                 };

//                 const rzp1 = new window.Razorpay(razorpayOptions);
//                 rzp1.open();
//                 setLoading(false);
//             } else {
//                 console.error('Failed to create subscription:', subscriptionResponse.data.message);
//                 alert("Failed to create subscription. Please try again.");
//                 setLoading(false);
//             }
//         } catch (error) {
//             console.error('Error initializing Razorpay:', error);
//             alert("Error processing your request. Please try again.");
//             setLoading(false);
//         }
//     };

//     const handleCancelPlan = () => {
//         setIsConfirmOpen(true);
//     };

//     const confirmCancellation = async () => {
//         setLoading(true);
//         try {
//             const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/cancel-subscription`, {
//                 subscriptionId
//             });
//             if (response.data.status === "success") {
//                 alert("Subscription cancelled successfully.");
//                 setSubscriptionStatus('cancelled'); // Update the status locally
//                 onClose();
//             } else {
//                 alert("Failed to cancel subscription. Please try again.");
//             }
//         } catch (error) {
//             alert("Error processing your request. Please try again.");
//             console.error('Error cancelling subscription:', error);
//         }
//         setLoading(false);
//         setIsConfirmOpen(false);
//     };

//     const modalStyle = {
//         maxWidth: isSubscribed ? '450px' : '650px'
//     };

//     return (
//         <div className="upgrade-modal">
//             <div className="upgrade-modal-content" ref={ref} style={modalStyle}>
//                 <div className="modal-header">
//                     <h3 className="modal-heading">Upgrade Your Plan</h3>
//                     <button onClick={onClose} className="close-button"><i className="fa-solid fa-xmark"></i></button>
//                 </div>
//                 <div className="plans-container">
//                     { !isSubscribed && (
//                         <div className="upgrade-plan-option">
//                             <h3>Free</h3>
//                             <p className="upgrade-amount">{currency}0/month</p>
//                             <button className="current-plan-button">Free Plan</button>
//                             <ul className="features-list">
//                                 <li><i className="fa-solid fa-check"></i> 5 messages per 3 hours</li>
//                             </ul>
//                         </div>
//                     )}
//                     <div className="upgrade-plan-option plus">
//                         <h3>Plus</h3>
//                         <p className="upgrade-amount">{pricing}/month</p>
//                         {isSubscribed ? (
//                             <>
//                                 <button className="current-plan-button">Your Plan Expires On: {currentEndDate}</button>
//                                 {subscriptionStatus === 'cancelled' ? (
//                                     <button className="current-plan-button">Plan Cancelled</button>
//                                 ) : (
//                                     <button onClick={handleCancelPlan} className="cancel-plan-button" disabled={loading}>
//                                         {loading ? 'Processing...' : 'Cancel Plan'}
//                                     </button>
//                                 )}
//                             </>
//                         ) : (
//                             <button onClick={handlePayment} className="upgrade-button" disabled={loading}>
//                                 {loading ? 'Processing...' : 'Upgrade to Plus'}
//                             </button>
//                         )}
//                         <ul className="features-list">
//                             <li><i className="fa-solid fa-check"></i> 35 messages per 3 hours</li>
//                         </ul>
//                         {transactionHistory.length > 0 && (
//                             <div className="transaction-history">
//                                 <h4>Transaction History</h4>
//                                 <ul>
//                                     {transactionHistory.map((transaction, index) => (
//                                         <li key={index}>{transaction.date} - {transaction.amount}</li>
//                                     ))}
//                                 </ul>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//             <ConfirmationDialog
//                 ref={ref}
//                 isOpen={isConfirmOpen}
//                 onClose={() => setIsConfirmOpen(false)}
//                 onConfirm={confirmCancellation}
//                 messageContent="Are you sure you want to cancel your subscription?"
//             />
//         </div>
//     );
// });

// export default UpgradePlanModal;
