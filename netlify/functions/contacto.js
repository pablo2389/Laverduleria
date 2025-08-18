import { db } from "./firebase"; // IMPORTANTE: misma carpeta
import { collection, addDoc } from "firebase/firestore";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);

    await addDoc(collection(db, "contactos"), {
      nombre: data.nombre,
      email: data.email,
      mensaje: data.mensaje,
      fecha: new Date().toISOString(),
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
