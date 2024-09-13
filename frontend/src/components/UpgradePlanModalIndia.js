import React, { forwardRef, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import '../App.css';

const UpgradePlanModalIndia = forwardRef(({ isOpen, onClose, userCountry, userEmail, userName }, ref) => {
    const [isPremiumActive, setIsPremiumActive] = useState(false);
    const [premiumExpirationDate, setPremiumExpirationDate] = useState('');
    const [order, setOrder] = useState(null);  // State to store the order details
    const rzpRef = useRef(null);  // Reference to store the Razorpay instance

    // Function to create an order
    const createOrder = async () => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/orders`, {
                amount: 2900,  // Amount in paise for Rs 29
                currency: "INR"
            });
            setOrder(response.data);
        } catch (error) {
            console.error('Error creating order:', error);
        }
    };

    const checkPremiumStatus = useCallback(async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/check-premium-status`, { params: { userEmail } });
            setIsPremiumActive(response.data.isPremiumActive);
            setPremiumExpirationDate(response.data.premiumEndIST);  // Save the formatted expiration date from the server
        } catch (error) {
            console.error('Error checking premium status:', error);
            setIsPremiumActive(false);
        }
    }, [userEmail]);

    const handlePaymentSuccess = useCallback(async (response) => {
        try {
          const verificationResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/verify-payment`, {
            orderId: order.id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature
          });
          if (verificationResponse.data.verified) {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/update-premium`, { userEmail: userEmail });
            checkPremiumStatus();

            // Facebook Pixel Tracking
            window.fbq('track', 'Subscribe', {
                value: 29.00,
                currency: 'INR',
                subscription_id: order.id,
            });

            // Twitter Pixel Tracking
            window.twq('track', 'tw-omgwl-onotj', {
                value: 29.00, // Assuming you want to pass the same value as FB pixel
                currency: 'INR',
                conversion_id: order.id // Passing the order ID as the conversion ID for deduplication
            });
          }
        } catch (error) {
          console.error('Error during payment process:', error);
        }
    }, [order, userEmail, checkPremiumStatus]);
      

    const loadRazorpay = useCallback(() => {
        if (!order) return;

        const options = {
            "key": process.env.REACT_APP_RAZORPAY_KEY_ID,
            "amount": order.amount, 
            "currency": order.currency,
            "name": "GetBooks.ai",
            "description": "Upgrade to Premium",
            "image": "/GetBooks_64_64.png",
            "order_id": order.id,
            "handler": handlePaymentSuccess,
            "prefill": {
                "name": userName, 
                "email": userEmail
            }
        };
        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response) {
            console.error(response.error.code);
        });
        rzpRef.current = rzp1;
    }, [order, userEmail, userName, handlePaymentSuccess]);

    useEffect(() => {
        if (isOpen) {
            createOrder();  // Create an order when the modal is open
        }
    }, [isOpen]);

    useEffect(() => {
        if (order) {
            loadRazorpay();  // Load Razorpay checkout when order is set
        }
    }, [order, loadRazorpay]);

    const handleRazorpayPayment = () => {
        rzpRef.current.open();  // Open Razorpay checkout
    };

    useEffect(() => {
        if (isOpen) {
            checkPremiumStatus();
        }
    }, [isOpen, checkPremiumStatus]);

    if (!isOpen || !userCountry) return null;

    return (
        <div className="upgrade-modal">
            <div className="upgrade-modal-content" ref={ref}>
                <div className="modal-header">
                    <h3 className="modal-heading">Upgrade Your Plan</h3>
                    <button onClick={onClose} className="close-button"><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="plans-container">
                    <div className="upgrade-plan-option premium">
                        <h3>Premium</h3>
                        <p className="upgrade-amount">Rs 29/month</p>
                        {!isPremiumActive ?
                            <button className="upgrade-button" onClick={handleRazorpayPayment}>
                                Upgrade to Premium
                            </button> :
                            <div>
                                <button className="current-plan-button">
                                    Expires on {premiumExpirationDate}
                                </button>
                            </div>
                        }
                        <ul className="features-list">
                            <li><i className="fa-solid fa-check"></i> 30 messages per 3 hours</li>
                        </ul>
                    </div>
                    {!isPremiumActive && (
                        <div className="upgrade-plan-option premium">
                            <h3>Free</h3>
                            <p className="upgrade-amount">Rs 0/month</p>
                            <div>
                                <button className="current-plan-button">
                                    Your current plan
                                </button>
                            </div>
                            <ul className="features-list">
                                <li><i className="fa-solid fa-check"></i> 5 messages per 3 hours</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default UpgradePlanModalIndia;
