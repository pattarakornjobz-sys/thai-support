// api/drive-list.js
// แสดงรายการไฟล์ในโฟลเดอร์ Google Drive ที่กำหนดไว้ (อ่านอย่างเดียว ผ่าน OAuth refresh token)
// ต้องตั้งค่า Environment Variables บน Vercel — ดูรายละเอียดใน api/_drive-auth.js

const { google } = require('googleapis');
const { getDriveAuth } = require('./_drive-auth');

const SUPPORTED_EXPORT = {
  'application/vnd.google-apps.document': true,
  'application/vnd.google-apps.spreadsheet': true,
  'application/vnd.google-apps.presentation': true,
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const auth = getDriveAuth();

  if (!auth) {
    res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN บน Vercel' });
    return;
  }
  if (!folderId) {
    res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GOOGLE_DRIVE_FOLDER_ID บน Vercel' });
    return;
  }

  try {
    const drive = google.drive({ version: 'v3', auth });
    const result = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, modifiedTime, size)',
      orderBy: 'modifiedTime desc',
      pageSize: 200,
    });
    const files = (result.data.files || []).filter(f => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      return SUPPORTED_EXPORT[f.mimeType] || ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'jpg', 'jpeg', 'png'].includes(ext);
    });
    res.status(200).json({ files });
  } catch (err) {
    res.status(500).json({
      error: 'โหลดรายการไฟล์จาก Google Drive ไม่สำเร็จ: ' + String(err && err.message ? err.message : err),
    });
  }
};
