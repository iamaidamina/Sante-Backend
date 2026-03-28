const { GoogleGenerativeAI } = require("@google/generative-ai");

async function obtenerRespuestaGemini(pregunta) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no esta configurada');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    const result = await model.generateContent(pregunta);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("[Gemini Service] Error detallado:", error);
    if (error.status === 429) {
      throw new Error("Límite de cuota excedido. Por favor intenta en un minuto.");
    }
    throw new Error("No se pudo conectar con el asistente de salud.");
  }
}

module.exports = { obtenerRespuestaGemini };
