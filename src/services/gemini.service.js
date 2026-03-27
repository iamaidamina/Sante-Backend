const { GoogleGenerativeAI } = require('@google/generative-ai');

async function analizarFormula(imageBuffer, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no esta configurada');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Analiza esta formula medica o receta medica escrita en espanol.
Extrae la siguiente informacion:
1. nombre: El nombre del medicamento principal recetado
2. frecuencia_horas: Cada cuantas horas debe tomarse. Solo puede ser uno de estos valores: 4, 6, 8, 12 o 24. Si dice "cada 8 horas" pon 8. Si dice "3 veces al dia" pon 8. Si dice "2 veces al dia" pon 12. Si dice "1 vez al dia" pon 24. Si no se especifica, pon 8.
3. descripcion: Una breve descripcion de las indicaciones (dosis, via de administracion, con o sin alimentos, etc). Maximo 200 caracteres.

Si la imagen contiene multiples medicamentos, extrae solo el primero.
Si no puedes leer la formula o la imagen no es una formula medica, responde con: {"error": "No se pudo leer la formula medica"}

Responde UNICAMENTE con JSON valido, sin markdown, sin bloques de codigo, solo el JSON:
{"nombre": "string", "frecuencia_horas": number, "descripcion": "string"}`;

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: mimeType,
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = result.response;
  const text = response.text().trim();

  console.log('[Gemini] Respuesta:', text);

  // Limpiar respuesta (remover posibles backticks de markdown)
  const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const parsed = JSON.parse(cleanText);

  if (parsed.error) {
    throw new Error(parsed.error);
  }

  return {
    nombre: parsed.nombre || '',
    frecuencia_horas: parsed.frecuencia_horas || 8,
    descripcion: parsed.descripcion || '',
  };
}

module.exports = { analizarFormula };
