// api/claude.js
// Serverless proxy: รับคำขอจากหน้าเว็บ แล้วยิงต่อไปที่ Anthropic API โดยแนบ API key
// (เก็บไว้เป็น Environment Variable บน Vercel เท่านั้น ไม่เปิดเผยฝั่ง client)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY บน Vercel (Settings > Environment Variables)' });
    return;
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await anthropicRes.json();
    res.status(anthropicRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
};
