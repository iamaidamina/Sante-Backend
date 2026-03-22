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

    console.log(`[WhatsApp] Enviando a ${cleanPhone}: ${message}`);

    // Use template message (required for Meta test number)
    // When you add your own business number, change to 'text' type
    const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
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

    const data = await response.json();

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
