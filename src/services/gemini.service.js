
const { GoogleGenerativeAI } = require('@google/generative-ai');


async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function obtenerRespuestaGemini(pregunta, retries = 3, delayMs = 35000, modelo = 'gemini-2.0-flash') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no esta configurada');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelo });

  // Prompt para respuestas responsables sobre medicamentos y salud
  const prompt = `Responde de forma clara, responsable y sin dar diagnósticos médicos. Si te preguntan por efectos secundarios, automedicación o sobredosis de medicamentos, responde siempre que consulten a un médico local y proporciona información general basada en fuentes confiables. Pregunta: ${pregunta}`;

  // Ralentizar peticiones si se desea (por ejemplo, 2 segundos entre cada petición)
  await sleep(2000);

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();
    console.log(`[Gemini][${modelo}] Respuesta:`, text);
    return text;
  } catch (error) {
    // Manejo de error 429 Too Many Requests
    if (error.status === 429 && retries > 0) {
      const retryDelay = (error.errorDetails && error.errorDetails[2] && error.errorDetails[2].retryDelay)
        ? parseInt(error.errorDetails[2].retryDelay.replace('s','')) * 1000
        : delayMs;
      console.log(`[Gemini][${modelo}] Cuota excedida, esperando ${retryDelay/1000} segundos antes de reintentar...`);
      await sleep(retryDelay);
      // Intentar con el modelo alternativo si es el primer fallo
      if (modelo === 'gemini-2.0-flash' && retries === 3) {
        console.log('[Gemini] Intentando con modelo gemini-1.5-flash...');
        return obtenerRespuestaGemini(pregunta, retries - 1, delayMs * 2, 'gemini-1.5-flash');
      }
      return obtenerRespuestaGemini(pregunta, retries - 1, delayMs * 2, modelo);
    }
    throw error;
  }
}

module.exports = { obtenerRespuestaGemini };
