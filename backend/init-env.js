const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  const fallbackEnv = `DATABASE_URL="file:./dev.db"
PORT=3001
JWT_SECRET="fallback_jwt_secret_for_railway_deployments_only"
ADMIN_KEY_SALT="axion_fallback_salt"
`;
  fs.writeFileSync(envPath, fallbackEnv);
  console.log('Created fallback .env file for ephemeral environment.');
} else {
  console.log('.env file already exists, skipping fallback creation.');
}
