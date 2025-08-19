// contacto.js
const { db } = require("./firebaseConfig.js");
const { collection, addDoc } = require("firebase/firestore");
const nodemailer = require("nodemailer");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { nombre, email, mensaje } = JSON.parse(event.body);

    if (!nombre || !email || !mensaje) {
      return { statusCode: 400, body: "Faltan datos" };
    }

    // Guardar mensaje en Firestore
    await addDoc(collection(db, "contactos"), {
      nombre,
      email,
      mensaje,
      fecha: new Date().toISOString(),
    });

    // Enviar correo con Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "pablomas.kpo2389@gmail.com",
        pass: "lfmgoaneigqjpztr"
      }
    });

    const mailOptions = {
      from: `"Verdulería" <pablomas.kpo2389@gmail.com>`,
      to: "pablomas.kpo2389@gmail.com",
      subject: "Nuevo mensaje desde la verdulería",
      text: `Nombre: ${nombre}\nEmail: ${email}\nMensaje: ${mensaje}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado:", info.response);

    return { statusCode: 200, body: "Mensaje enviado correctamente ✅" };
  } catch (error) {
    console.error("Error en contacto:", error);
    return { statusCode: 500, body: "Error interno del servidor: " + error.message };
  }
};
