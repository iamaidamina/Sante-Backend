
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function obtenerRespuestaGemini(pregunta) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no esta configurada');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Prompt para respuestas responsables sobre medicamentos y salud
  const prompt = `Responde de forma clara, responsable y sin dar diagnósticos médicos. Si te preguntan por efectos secundarios, automedicación o sobredosis de medicamentos, responde siempre que consulten a un médico local y proporciona información general basada en fuentes confiables. Pregunta: ${pregunta}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text().trim();
  console.log('[Gemini] Respuesta:', text);
  return text;
}

module.exports = { obtenerRespuestaGemini };
