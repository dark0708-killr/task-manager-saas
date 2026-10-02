/**
 * Redis Configuration - Task Management SaaS
 */

import { createClient } from 'redis';

const client = createClient({
  // In production, use Redis URL from environment
  // url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Handle connection errors
client.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async () => {
  try {
    // Check if already connected
    if (client.isOpen) {
      return client;
    }

    await client.connect();
    console.log('✅ Redis connected successfully');
    return client;
  } catch (error) {
    console.warn('⚠️ Redis connection failed, continuing without Redis');
    // Return a mock client for development
    return {
      async publish() {},
      async subscribe() {},
      async get() { return null; },
      async set() {},
      async del() { return 0; },
      isOpen: true,
    };
  }
};

/**
 * Redis helper functions for task management
 */

export const redis = {
  // Set with expiry
  async setex(key, seconds, value) {
    if (!client.isOpen) return;
    await client.set(key, value, { EX: seconds });
  },

  // Get value
  async get(key) {
    if (!client.isOpen) return null;
    return await client.get(key);
  },

  // Increment counter
  async incr(key) {
    if (!client.isOpen) return 0;
    return await client.incr(key);
  },

  // Decrement counter
  async decr(key) {
    if (!client.isOpen) return 0;
    return await client.decr(key);
  },

  // Check if key exists
  async exists(key) {
    if (!client.isOpen) return false;
    return await client.exists(key);
  },

  // Delete key
  async del(key) {
    if (!client.isOpen) return 0;
    return await client.del(key);
  },

  // Subscribe to channel
  async subscribe(channel, messageHandler) {
    if (!client.isOpen) return;
    const subscriber = client.duplicate();
    await subscriber.connect();
    const pubSub = subscriber.getSubPubInterface();
    await pubSub.subscribe(channel);
    pubSub.on(messageHandler ? 'message' : null, messageHandler
      ? (msg) => messageHandler(msg.data.toString())
      : null);
    return subscriber;
  },

  // Publish to channel
  async publish(channel, message) {
    if (!client.isOpen) return;
    await client.publish(channel, message);
  },
};

export default { connectRedis, redis };