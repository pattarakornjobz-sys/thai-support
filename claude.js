// api/extract-doc.js
// รับไฟล์ .doc (Word 97-2003) แบบ base64 แล้วดึงข้อความออกมาด้วย word-extractor
// (ทำงานฝั่งเซิร์ฟเวอร์ เพราะ .doc เป็น binary format ที่ parse ในเบราว์เซอร์โดยตรงไม่ได้)

const WordExtractor = require('word-extractor');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const base64 = req.body && req.body.data;
  if (!base64) {
    res.status(400).json({ error: 'missing file data' });
    return;
  }

  try {
    const buffer = Buffer.from(base64, 'base64');
    const doc = await new WordExtractor().extract(buffer);
    const text = doc.getBody() || '';
    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: 'อ่านไฟล์ .doc ไม่สำเร็จ: ' + String(err && err.message ? err.message : err) });
  }
};
