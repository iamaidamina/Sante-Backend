const { GoogleGenerativeAI } = require("@google/generative-ai");

// Inicializamos la API con tu llave
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function obtenerRespuestaGemini(pregunta) {
  try {
    // CAMBIO CLAVE: Usamos 'gemini-1.5-flash'. 
    // El modelo '2.0-flash' te daba error de "cuota 0" porque a veces 
    // requiere activación manual o es experimental en ciertas cuentas.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Añadimos una configuración de generación opcional para mayor estabilidad
    const result = await model.generateContent(pregunta);
    const response = await result.response;
    
    const text = response.text();
    
    if (!text) {
      throw new Error("RESPUESTA_VACIA");
    }

    return text;

  } catch (error) {
    // Log detallado para ti en el servidor
    console.error("[Gemini Service] Error detectado:", error.message);

    // Mapeo de errores para el frontend
    // Google SDK a veces no trae el .status directo, usamos el mensaje si es necesario
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("CUOTA_EXCEDIDA");
    }
    
    if (error.message?.includes("404") || error.message?.includes("not found")) {
      throw new Error("MODELO_NO_DISPONIBLE");
    }

    // Si el error es por seguridad (bloqueo de contenido)
    if (error.message?.includes("SAFETY")) {
      throw new Error("CONTENIDO_BLOQUEADO");
    }

    throw new Error("ERROR_GENERAL");
  }
}

module.exports = { obtenerRespuestaGemini };