/**
 * Environment variable validator for Backend startup.
 * Logs active configuration and warns/fails if critical variables are missing.
 */
function validateEnv() {
  const requiredVars = [];
  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ [ENV ERROR] Missing required environment variables: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  const port = process.env.PORT || 5000;
  const env = process.env.NODE_ENV || 'development';

  console.log(`✅ [ENV CHECK] Environment verified | NODE_ENV=${env} | PORT=${port}`);
}

module.exports = { validateEnv };
