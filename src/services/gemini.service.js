
const { GoogleGenerativeAI } = require('@google/generative-ai');



const sleep = ms => new Promise(res => setTimeout(res, ms));

async function obtenerRespuestaGemini(pregunta, reintentos = 2) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no esta configurada');
  }

  // Forzar la versión estable de la API (v1)
  const genAI = new GoogleGenerativeAI(apiKey);
  let model;
  let modeloUsado = 'gemini-1.5-flash';
  try {
    model = genAI.getGenerativeModel(
      { model: modeloUsado },
      { apiVersion: 'v1' }
    );
  } catch (e) {
    // fallback inmediato si la SDK lanza error al crear el modelo
    console.warn('[Gemini Service] Fallback a gemini-pro por error al instanciar modelo:', e.message);
    modeloUsado = 'gemini-pro';
    model = genAI.getGenerativeModel(
      { model: modeloUsado },
      { apiVersion: 'v1' }
    );
  }

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
    // Si el error es 404, intentamos fallback a gemini-pro
    if (error.status === 404 && modeloUsado !== 'gemini-pro') {
      console.warn('[Gemini Service] 404: Fallback a gemini-pro');
      const fallbackModel = genAI.getGenerativeModel(
        { model: 'gemini-pro' },
        { apiVersion: 'v1' }
      );
      try {
        const result = await fallbackModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (fallbackError) {
        if (fallbackError.status === 429 && reintentos > 0) {
          console.warn(`[Gemini Service] Cuota excedida (fallback), reintentando en 3s... Intentos restantes: ${reintentos}`);
          await sleep(3000);
          return obtenerRespuestaGemini(pregunta, reintentos - 1);
        }
        throw fallbackError;
      }
    }
    if (error.status === 404) {
      console.error("[Gemini Service] Error 404: El modelo no fue encontrado. Revisa el nombre.");
    }
    throw error;
  }
}

module.exports = { obtenerRespuestaGemini };
