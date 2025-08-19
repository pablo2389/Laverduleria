// netlify/functions/ofertas-semanales.js
import { db } from "./firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import nodemailer from "nodemailer";

export const handler = async () => {
  try {
    const snapshot = await getDocs(collection(db, "contactos"));
    const emails = snapshot.docs.map(doc => doc.data().email);

    if (emails.length === 0) {
      return { statusCode: 200, body: "No hay contactos" };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      bcc: emails,
      subject: "🍎 Ofertas de la semana",
      html: "<h2>¡Ofertas frescas!</h2>",
    });

    return { statusCode: 200, body: "Ofertas enviadas ✅" };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: "Error: " + error.message };
  }
};
