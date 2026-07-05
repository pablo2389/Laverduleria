// netlify/functions/contacto.js
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");

// ✅ Crear credenciales desde variables de entorno
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

// ✅ Inicializar Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore(app);

exports.handler = async function (event) {
  // ✅ Manejo de preflight (CORS)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Limitar si querés a tu dominio
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Method Not Allowed",
    };
  }

  try {
    const { nombre, email, mensaje, venta } = JSON.parse(event.body);
    console.log("Datos recibidos:", { nombre, email, mensaje, venta });

    // Validación básica
    if (!venta && (!nombre || !email || !mensaje)) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: "Faltan datos",
      };
    }

    // Guardar contacto en Firestore
    if (!venta) {
      await db.collection("contactos").add({
        nombre,
        email,
        mensaje,
        fecha: new Date().toISOString(),
      });
    }

    // Guardar venta en Firestore
    if (venta) {
      await db.collection("ventas").add({
        ...venta,
        fecha: new Date().toISOString(),
      });
    }

    // Configurar nodemailer con variables de entorno
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Verdulería" <${process.env.FROM_EMAIL}>`,
      to: process.env.FROM_EMAIL,
      subject: venta ? "Nueva venta registrada" : "Nuevo mensaje desde la verdulería",
      text: venta
        ? `Venta realizada:\n${JSON.stringify(venta, null, 2)}`
        : `Nombre: ${nombre}\nEmail: ${email}\nMensaje: ${mensaje}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado:", info.response);

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Mensaje/venta enviado correctamente ✅",
    };
  } catch (error) {
    console.error("Error en contacto:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Error interno del servidor: " + error.message,
    };
  }
};
