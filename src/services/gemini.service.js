const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. Configuración de la API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function obtenerRespuestaGemini(pregunta) {
    try {
        // 2. Selección del modelo (Usamos el nombre exacto de tu ejemplo)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 3. System Instruction (Adaptado a tu App de Salud 'Sante')
        const promptEstructurado = `
            Actúa como un asistente médico virtual experto llamado SANTE.
            Proporciona información clara y profesional sobre salud y medicamentos.
            
            Reglas:
            - Si te preguntan por dosis, advierte siempre que debe ser consultado con un médico.
            - Mantén un tono empático y serio.
            - Responde directamente al usuario.

            Pregunta del usuario: ${pregunta}
        `;

        // 4. Ejecución (Igual a tu ejemplo)
        const result = await model.generateContent(promptEstructurado);
        const response = await result.response;
        
        // Devolvemos el texto plano (o podrías parsear JSON si lo necesitas como en tu ejemplo)
        return response.text();

    } catch (error) {
        // Manejo de errores basado en lo que vimos en los logs
        if (error.status === 429) {
            console.error("Error 429: Cuota excedida en el Plan Gratuito.");
            throw new Error("CUOTA_EXCEDIDA");
        }
        
        console.error("Error detallado en Gemini Service:", error);
        throw new Error("No se pudo obtener respuesta de Gemini");
    }
}

module.exports = { obtenerRespuestaGemini };