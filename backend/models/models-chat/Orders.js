const mongoose = require('mongoose');
const { Schema } = mongoose;

const ordersSchema = new Schema({
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pinCode: { type: String, required: true },
  phone: { type: String, required: true },
  deliveryDate: { type: String, required: true }, // Stores the calculated delivery date
  bookTitle: { type: String, required: true }, // Stores the title of the book
  author: { type: String, required: true }, // Stores the author of the book
  amountPaid: { type: Number, required: true }, // Stores the amount paid for the order
  amazonLink: { type: String, required: true }, // Stores the link to the book on Amazon
  orderId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now } // Automatically capture the date of order creation
});

module.exports = mongoose.model('Orders', ordersSchema);
