const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  // You'll need to download your service account key from Firebase Console
  // Go to Project Settings > Service Accounts > Generate New Private Key
  type: "service_account",
  project_id: "lettrblack",
  private_key_id: "YOUR_PRIVATE_KEY_ID",
  private_key: "YOUR_PRIVATE_KEY",
  client_email: "YOUR_CLIENT_EMAIL",
  client_id: "YOUR_CLIENT_ID",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "YOUR_CERT_URL"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'lettrblack.appspot.com'
});

const bucket = admin.storage().bucket();

// CORS configuration
const corsConfiguration = [
  {
    origin: [
      "https://jovial-sable-9ffc51.netlify.app",
      "http://localhost:3000",
      "http://localhost:8080",
      "http://localhost:8081",
      "http://localhost:8082",
      "http://localhost:5173"
    ],
    method: ["GET", "POST", "PUT", "DELETE", "HEAD"],
    maxAgeSeconds: 3600,
    responseHeader: [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "User-Agent",
      "x-goog-resumable"
    ]
  }
];

async function setCors() {
  try {
    await bucket.setCorsConfiguration(corsConfiguration);
    console.log('✅ CORS configuration set successfully!');
  } catch (error) {
    console.error('❌ Error setting CORS:', error);
  }
}

setCors(); 