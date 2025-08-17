const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const fetch = require("node-fetch"); // Node 18+ tiene fetch nativo

admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

// Función HTTP que recibe el formulario desde Netlify
exports.contacto = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Método no permitido");
  }

  const formData = req.body;

  try {
    // URL de tu webhook de N8N (cuando la tengas reemplazala aquí)
    const n8nWebhookUrl = "https://n8n.tu-dominio.com/webhook/contacto";

    // Enviar los datos a N8N
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error("Error enviando a N8N");
    }

    // Guardar en Firestore
    const docRef = await admin.firestore().collection("contactos").add({
      ...formData,
      enviadoEn: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({
      success: true,
      message: "Formulario enviado a N8N y guardado en Firestore!",
      docId: docRef.id,
    });
  } catch (error) {
    logger.error("Error enviando a N8N o Firestore:", error);
    res.status(500).send({ success: false, message: error.message });
  }
});
