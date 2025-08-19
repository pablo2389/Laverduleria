// netlify/functions/ofertas-semanales.js
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import nodemailer from "nodemailer";

export const handler = async (event, context) => {
  try {
    // 1️⃣ Obtener todos los contactos
    const snapshot = await getDocs(collection(db, "contactos"));
    const emails = snapshot.docs.map(doc => doc.data().email);

    if (emails.length === 0) {
      return { statusCode: 200, body: "No hay contactos para enviar" };
    }

    // 2️⃣ Configurar transporte
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 3️⃣ Email de ofertas
    const mensaje = {
      from: `"Verdulería App" <${process.env.SMTP_USER}>`,
      bcc: emails, // se manda a todos en copia oculta
      subject: "🍎 Ofertas de la semana en la Verdulería",
      html: `<h2>¡Ofertas frescas de la semana!</h2>
             <ul>
               <li>Frutillas $6000/kg 🍓</li>
               <li>Papas $700/kg 🥔</li>
             </ul>
             <p>Gracias por elegirnos 💚</p>`
    };

    await transporter.sendMail(mensaje);

    return { statusCode: 200, body: "Ofertas enviadas con éxito a " + emails.length + " contactos" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Error enviando ofertas: " + err.message };
  }
};
