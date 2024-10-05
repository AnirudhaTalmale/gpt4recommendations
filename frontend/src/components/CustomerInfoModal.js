import React, { useEffect } from 'react';

const CustomerInfoModal = ({ isVisible, onClose, onSubmit, customerInfo, setCustomerInfo }) => {
    useEffect(() => {
        // Define the function inside useEffect
        const calculateAndSetDeliveryDate = () => {
            const today = new Date();
            const deliveryDate = new Date(today.setDate(today.getDate() + 2)); // Add 2 days to the current date
            const formattedDate = "Free Delivery " + deliveryDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long' }); // Format the date as 'Free Delivery October 6'
            setCustomerInfo(prevInfo => ({ ...prevInfo, deliveryDate: formattedDate }));
        };

        if (isVisible && !customerInfo.deliveryDate) {
            calculateAndSetDeliveryDate();
        }
    }, [isVisible, customerInfo.deliveryDate, setCustomerInfo]); // Dependencies remain the same

    const handleInputChange = (e) => {
        setCustomerInfo({ ...customerInfo, [e.target.name]: e.target.value });
    };

    if (!isVisible) return null;

    return (
        <>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.5)', // Overlay
                zIndex: 999, // Ensure it is below the modal but above other content
            }} onClick={onClose}></div>
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
                background: 'white',
                padding: '40px 40px 23px 20px',
                borderRadius: '10px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                width: '70vw',
                maxWidth: '500px'
            }}>
                <form onSubmit={onSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <input type="email" name="email" placeholder="Email Address" value={customerInfo.email} onChange={handleInputChange} required 
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                        <input type="text" name="firstName" placeholder="First Name" value={customerInfo.firstName} onChange={handleInputChange} required 
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                        <input type="text" name="lastName" placeholder="Last Name" value={customerInfo.lastName} onChange={handleInputChange} required 
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                        <input type="text" name="streetAddress" placeholder="Street Address" value={customerInfo.streetAddress} onChange={handleInputChange} required 
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                        <input type="text" name="city" placeholder="Town / City" value={customerInfo.city} onChange={handleInputChange} required 
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                        <input type="text" name="state" placeholder="State" value={customerInfo.state} onChange={handleInputChange} required 
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                        <input type="text" name="pinCode" placeholder="PIN Code" value={customerInfo.pinCode} onChange={handleInputChange} required 
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                        <input type="text" name="phone" placeholder="Phone" value={customerInfo.phone} onChange={handleInputChange} required 
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                        <input type="text" name="deliveryDate" placeholder="Delivery Date" value={customerInfo.deliveryDate || ''} 
                        style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#f8f8f8', color: 'black', fontWeight: 'bold' }} disabled />
                    </div>
                    <button type="submit" style={{ padding: '10px 20px', marginRight: '10px', marginBottom: '10px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Proceed to Pay
                    </button>
                    <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: 'grey', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Cancel
                    </button>
                </form>
            </div>
        </>
    );
};

export default CustomerInfoModal;
