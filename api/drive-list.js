// api/drive-list.js
// แสดงรายการไฟล์ในโฟลเดอร์ Google Drive ที่กำหนดไว้ (ใช้ Service Account อ่านอย่างเดียว)
// ต้องตั้งค่า Environment Variables บน Vercel:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL  = อีเมลของ service account
//   GOOGLE_SERVICE_ACCOUNT_KEY    = private key ของ service account (คง \n ไว้ตามที่ Google ให้มา)
//   GOOGLE_DRIVE_FOLDER_ID        = ID ของโฟลเดอร์ที่แชร์ให้ service account แล้ว

const { google } = require('googleapis');

const SUPPORTED_EXPORT = {
  'application/vnd.google-apps.document': true,
  'application/vnd.google-apps.spreadsheet': true,
  'application/vnd.google-apps.presentation': true,
};

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '';
  const key = rawKey.replace(/\\n/g, '\n');
  if (!email || !key) return null;
  return new google.auth.JWT(email, null, key, ['https://www.googleapis.com/auth/drive.readonly']);
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const auth = getAuth();

  if (!auth) {
    res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY บน Vercel' });
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
