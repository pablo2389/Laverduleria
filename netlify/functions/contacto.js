// netlify/functions/contacto.js
const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);

    // Aquí colocá la URL de tu webhook N8N
    const n8nWebhookURL = "https://tu-n8n-public-url/webhook/contacto";

    const response = await fetch(n8nWebhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      return { statusCode: 500, body: `Error enviando a N8N: ${text}` };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Formulario enviado correctamente" }),
    };
  } catch (error) {
    return { statusCode: 500, body: `Error: ${error.message}` };
  }
};

