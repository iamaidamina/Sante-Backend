
const { GoogleGenerativeAI } = require('@google/generative-ai');



const sleep = ms => new Promise(res => setTimeout(res, ms));

async function obtenerRespuestaGemini(pregunta, reintentos = 2) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no esta configurada');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  // Usar modelo estable sin -latest
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Prompt responsable
  const prompt = `Responde de forma clara, responsable y sin dar diagnósticos médicos. Si te preguntan por efectos secundarios, automedicación o sobredosis de medicamentos, responde siempre que consulten a un médico local y proporciona información general basada en fuentes confiables. Pregunta: ${pregunta}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    // Si es error de cuota (429), reintentamos después de una pausa
    if (error.status === 429 && reintentos > 0) {
      console.warn(`[Gemini Service] Cuota excedida, reintentando en 3s... Intentos restantes: ${reintentos}`);
      await sleep(3000);
      return obtenerRespuestaGemini(pregunta, reintentos - 1);
    }
    // Si el error es 404, imprimimos un aviso específico para debug
    if (error.status === 404) {
      console.error("[Gemini Service] Error 404: El modelo no fue encontrado. Revisa el nombre.");
    }
    throw error;
  }
}

module.exports = { obtenerRespuestaGemini };
