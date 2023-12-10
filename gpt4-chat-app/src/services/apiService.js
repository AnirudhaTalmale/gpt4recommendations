// // apiService.js
// import socket from './socket'; // Import the socket client setup

// export const sendQuery = (sessionId, content, onResponse, onError) => {
//   console.log('Sending query with sessionId:', sessionId);
//   console.log('Content being sent:', content);

//   // Listen for the response and error from the server
//   socket.on('response', (data) => {
//     console.log('Response from backend:', data);
//     onResponse(data); // Handle the response in the component
//   });

//   socket.on('error', (error) => {
//     console.error('Error in sendQuery:', error);
//     onError(error); // Handle error in the component
//   });

//   // Emitting the query to the server
//   socket.emit('query', {
//     sessionId: sessionId,
//     message: {
//       role: 'user',
//       content: content
//     }
//   });
// };


