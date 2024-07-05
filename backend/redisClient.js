const redis = require('redis');
const redisURL = process.env.NODE_ENV === 'local' ? process.env.REDIS_URL_LOCAL : process.env.REDIS_URL;

const redisClient = redis.createClient({
  url: redisURL
});

redisClient.connect();

redisClient.on('error', (err) => console.log('Redis Client Error', err));

module.exports = redisClient;
