const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL // Set your Redis server URL
});

redisClient.connect();

redisClient.on('error', (err) => console.log('Redis Client Error', err));

module.exports = redisClient;