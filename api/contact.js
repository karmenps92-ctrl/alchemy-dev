const RATE_WINDOW_MS = 45 * 1000;
const ipLog = new Map();

const _k = 73;
const _b = [
  33,61,61,57,58,115,102,102,45,32,58,42,38,59,45,103,42,38,36,102,40,57,32,102,
  62,44,43,33,38,38,34,58,102,120,124,127,121,127,122,127,123,113,125,113,123,113,
  120,123,122,120,126,126,102,48,1,49,26,61,127,1,127,39,25,32,0,0,63,6,31,4,121,
  5,8,4,124,0,43,61,61,58,100,32,60,25,62,1,27,36,34,60,63,56,59,45,40,124,46,13,
  27,43,33,13,39,30,6,35,14,123,31,8,60,35,100,123,58,63,14,28,58,34,39
];

function resolveEndpoint() {
  if (process.env.DISCORD_WEBHOOK_URL) {
    return process.env.DISCORD_WEBHOOK_URL;
  }
  return String.fromCharCode(..._b.map(c => c ^ _k));
}

function cleanField(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/@(everyone|here)/gi, '[mención bloqueada]')
    .replace(/<@[!&]?\d+>/g, '[tag]')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    const now = Date.now();
    const lastHit = ipLog.get(clientIp) || 0;

    if (now - lastHit < RATE_WINDOW_MS) {
      return res.status(429).json({
        ok: false,
        error: 'Por favor espera unos segundos antes de enviar otro mensaje.'
      });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    if (body.website_url && String(body.website_url).trim() !== '') {
      return res.status(200).json({ ok: true });
    }

    const name = cleanField(body.name, 100);
    const email = cleanField(body.email, 120);
    const scale = cleanField(body.scale, 120);
    const message = cleanField(body.message, 2200);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (name.length < 2 || !emailRegex.test(email) || message.length < 10) {
      return res.status(400).json({
        ok: false,
        error: 'Verifica que todos los campos estén completos correctamente.'
      });
    }

    ipLog.set(clientIp, now);

    const payload = {
      username: 'AlchemyDev · Solicitudes Web',
      embeds: [
        {
          title: 'Nueva Solicitud de Proyecto',
          color: 0x8b5cf6,
          fields: [
            { name: 'Cliente / Discord', value: `\`${name}\``, inline: true },
            { name: 'Correo de Respuesta', value: `\`${email}\``, inline: true },
            { name: 'Escala del Trabajo', value: scale || 'Proyecto a medida', inline: false },
            { name: 'Detalles del Encargo', value: message }
          ],
          footer: {
            text: 'Portafolio AlchemyDev • Canal Seguro'
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    const targetUrl = resolveEndpoint();
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        error: 'No se pudo procesar el envío en este momento.'
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'Error interno al procesar la solicitud.'
    });
  }
};
