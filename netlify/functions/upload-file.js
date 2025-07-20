const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: "lettrblack",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    }),
    storageBucket: 'lettrblack.appspot.com'
  });
}

const bucket = admin.storage().bucket();

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const { file, fileName, userId, fileType } = JSON.parse(event.body);

    if (!file || !fileName || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(file, 'base64');
    
    // Create file path
    const filePath = `notes/${userId}_${Date.now()}_${fileName}`;
    
    // Upload to Firebase Storage
    const fileRef = bucket.file(filePath);
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: fileType || 'application/octet-stream'
      }
    });

    // Get download URL
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500' // Far future expiration
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        fileUrl: url,
        fileName: fileName
      })
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Upload failed',
        details: error.message
      })
    };
  }
}; 