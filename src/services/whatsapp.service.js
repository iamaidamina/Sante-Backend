const CALLMEBOT_URL = 'https://api.callmebot.com/whatsapp.php';

async function sendWhatsAppMessage(phone, apikey, message) {
  try {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const url = `${CALLMEBOT_URL}?phone=${cleanPhone}&text=${encodedMessage}&apikey=${apikey}`;

    const response = await fetch(url);
    const body = await response.text();

    if (!response.ok || body.toLowerCase().includes('error')) {
      console.error(`[WhatsApp] Error enviando a ${cleanPhone}:`, body);
      return false;
    }

    console.log(`[WhatsApp] Mensaje enviado a ${cleanPhone}`);
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
