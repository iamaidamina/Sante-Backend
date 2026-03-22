const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0';

async function sendWhatsAppMessage(phone, message) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    console.error('[WhatsApp] Faltan variables de entorno: WHATSAPP_TOKEN o WHATSAPP_PHONE_ID');
    return false;
  }

  try {
    // Remove everything except digits (no + symbol for Meta API)
    const cleanPhone = phone.replace(/\D/g, '');

    // First try sending as free-form text
    let response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: message },
      }),
    });

    let data = await response.json();

    // If text message fails (test number only supports templates),
    // fall back to hello_world template with the message logged
    if (!response.ok) {
      console.log(`[WhatsApp] Texto libre no soportado, intentando con template...`);
      console.log(`[WhatsApp] Mensaje original: ${message}`);

      response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'template',
          template: {
            name: 'hello_world',
            language: { code: 'en_US' },
          },
        }),
      });

      data = await response.json();
    }

    if (!response.ok) {
      console.error(`[WhatsApp] Error enviando a ${cleanPhone}:`, JSON.stringify(data));
      return false;
    }

    console.log(`[WhatsApp] Mensaje enviado a ${cleanPhone}:`, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`[WhatsApp] Error de red enviando a ${phone}:`, error.message);
    return false;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { sendWhatsAppMessage, delay };
