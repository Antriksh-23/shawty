// Test setup file — runs before each test file
// Set required environment variables for the test environment

process.env.DATABASE_URL = 'postgresql://postgres:test@localhost:5432/shawty_test';
process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.GOOGLE_SAFE_BROWSING_KEY = '';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
process.env.BCRYPT_ROUNDS = '4'; // Fast rounds for tests
process.env.RATE_LIMIT_ANON_MAX = '5';
process.env.RATE_LIMIT_WINDOW_SECONDS = '3600';
process.env.REDIS_CODE_TTL = '86400';
process.env.NODE_ENV = 'test';
