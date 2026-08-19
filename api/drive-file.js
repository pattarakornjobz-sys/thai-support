// api/drive-file.js
// ดึงเนื้อไฟล์เดี่ยวจาก Google Drive กลับมาเป็น base64 (ให้หน้าเว็บส่งต่อเข้า pipeline ตรวจเอกสารเดิม)
// เอกสารแบบ Google Docs/Sheets/Slides (ไม่ใช่ไฟล์อัปโหลด) จะถูก export เป็น PDF ก่อนส่งกลับ
// ต้องตั้งค่า Environment Variables ชุดเดียวกับ api/drive-list.js

const { google } = require('googleapis');

const EXPORT_MIME = {
  'application/vnd.google-apps.document': 'application/pdf',
  'application/vnd.google-apps.spreadsheet': 'application/pdf',
  'application/vnd.google-apps.presentation': 'application/pdf',
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

  const fileId = req.query && req.query.fileId;
  if (!fileId) {
    res.status(400).json({ error: 'missing fileId' });
    return;
  }

  const auth = getAuth();
  if (!auth) {
    res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY บน Vercel' });
    return;
  }

  try {
    const drive = google.drive({ version: 'v3', auth });
    const meta = await drive.files.get({ fileId, fields: 'id, name, mimeType' });
    let { name, mimeType } = meta.data;
    let resp;

    if (EXPORT_MIME[mimeType]) {
      const exportType = EXPORT_MIME[mimeType];
      resp = await drive.files.export({ fileId, mimeType: exportType }, { responseType: 'arraybuffer' });
      mimeType = exportType;
      name = name.replace(/\.[^.]*$/, '') + '.pdf';
    } else {
      resp = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
    }

    const buffer = Buffer.from(resp.data);
    res.status(200).json({ name, mimeType, data: buffer.toString('base64') });
  } catch (err) {
    res.status(500).json({
      error: 'ดึงไฟล์จาก Google Drive ไม่สำเร็จ: ' + String(err && err.message ? err.message : err),
    });
  }
};
