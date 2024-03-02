// socket.js
import io from 'socket.io-client';

// Connect to your server
const socket = io(`${process.env.REACT_APP_BACKEND_URL}`);

export default socket;
