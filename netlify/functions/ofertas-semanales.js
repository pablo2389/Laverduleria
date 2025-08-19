import nodemailer from "nodemailer";
import { db } from "../../src/firebaseConfig"; // Importar Firestore
import { collection, getDocs } from "firebase/firestore";

export async function handler() {
  try {
    // 1️⃣ Leer todas las ofertas activas
    const ofertasCol = collection(db, "ofertas");
    const snapshotOfertas = await getDocs(ofertasCol);
    const ofertasActivas = snapshotOfertas.docs
      .map(doc => doc.data())
      .filter(oferta => oferta.activo);

    if (ofertasActivas.length === 0) {
      return { statusCode: 200, body: "No hay ofertas activas para enviar." };
    }

    // 2️⃣ Leer todos los emails de Firestore
    const contactosCol = collection(db, "contactos");
    const snapshotContactos = await getDocs(contactosCol);
    const emails = snapshotContactos.docs.map(doc => doc.data().email);

    if (emails.length === 0) {
      return { statusCode: 200, body: "No hay usuarios para enviar emails." };
    }

    // 3️⃣ Preparar el HTML del correo
    const html = `
      <h1>Ofertas de la semana</h1>
      <ul>
        ${ofertasActivas.map(o => `<li>${o.nombre}: ${o.descripcion} - ${o.precio}</li>`).join("")}
      </ul>
      <p>¡Gracias por comprar en nuestra verdulería!</p>
    `;

    // 4️⃣ Configurar Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false, // true si usas 465
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    // 5️⃣ Enviar correo a todos los usuarios
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: emails.join(","), // lista separada por comas
      subject: "🔥 Ofertas Semanales Verdulería",
      html,
    });

    return { statusCode: 200, body: "Emails enviados correctamente ✅" };
  } catch (error) {
    console.error("Error enviando ofertas:", error);
    return { statusCode: 500, body: "Error: " + error.message };
  }
}
