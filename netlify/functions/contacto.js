// netlify/functions/contacto.js
import { db } from "../../firebaseConfig"; // ajusta la ruta si tu config está en otro lugar
import { collection, addDoc } from "firebase/firestore";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);

    // Guardamos el formulario en la colección "contactos"
    await addDoc(collection(db, "contactos"), {
      nombre: data.nombre,
      email: data.email,
      mensaje: data.mensaje,
      fecha: new Date().toISOString(), // opcional, para registrar la fecha
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Formulario enviado correctamente" }),
    };
  } catch (error) {
    console.error("Error guardando en Firestore:", error);
    return { statusCode: 500, body: `Error: ${error.message}` };
  }
}
