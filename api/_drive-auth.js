// api/_drive-auth.js
// สร้าง Google OAuth2 client จาก refresh token (ใช้แทน Service Account
// เพราะหลายโปรเจกต์ Google Cloud ใหม่ถูกนโยบายองค์กรบล็อกไม่ให้สร้าง Service Account key)
//
// ต้องตั้งค่า Environment Variables บน Vercel:
//   GOOGLE_OAUTH_CLIENT_ID
//   GOOGLE_OAUTH_CLIENT_SECRET
//   GOOGLE_OAUTH_REFRESH_TOKEN
//   GOOGLE_DRIVE_FOLDER_ID

const { google } = require('googleapis');

function getDriveAuth() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

module.exports = { getDriveAuth };
