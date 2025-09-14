// Application configuration constants
export const CONFIG = {
  SHIT_TOKEN: 'shit-1170.meme-cooking.near',
  NETWORK_ID: 'mainnet',
  DEX_AGG: 'https://router.intear.tech/route',

  // FastNear API configuration
  FASTNEAR_API: {
    BASE_URL: 'https://api.fastnear.com/v1',
    TIMEOUT: 10000, // 10 seconds
  },
} as const;


// Individual exports for convenience
export const SHIT_TOKEN = CONFIG.SHIT_TOKEN;
export const NETWORK_ID = CONFIG.NETWORK_ID;
export const DEX_AGG = CONFIG.DEX_AGG;
export const FASTNEAR_API = CONFIG.FASTNEAR_API;
