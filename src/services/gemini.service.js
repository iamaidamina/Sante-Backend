const { GoogleGenerativeAI } = require("@google/generative-ai");

// Inicializamos la API con tu llave
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function obtenerRespuestaGemini(pregunta) {
  try {
    // IMPORTANTE: Usamos 'gemini-1.5-flash' sin prefijos raros.
    // Esta es la versión que mejor maneja la cuota gratuita actualmente.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(pregunta);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("[Gemini Service] Error detallado:", error.message);

    // Manejo inteligente de errores para el frontend
    if (error.status === 429) {
      throw new Error("CUOTA_EXCEDIDA");
    }
    
    if (error.status === 404) {
      throw new Error("MODELO_NO_DISPONIBLE");
    }

    throw new Error("ERROR_GENERAL");
  }
}

module.exports = { obtenerRespuestaGemini };
