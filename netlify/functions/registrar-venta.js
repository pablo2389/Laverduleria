import { db } from "./firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

// Validación de email
function esEmailValido(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Generar PDF
const generarPDF = (productos, cliente, email) =>
  new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    // Fuente UTF-8 (agregar DejaVuSans.ttf en /fonts)
    doc.font(path.join(process.cwd(), "fonts", "DejaVuSans.ttf"));

    doc.fontSize(20).text("Ticket de Compra - Verdulería", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Cliente: ${cliente}`);
    doc.text(`Email: ${email}`);
    doc.moveDown();

    doc.fontSize(12).text("Producto", { continued: true, width: 200 });
    doc.text("Cantidad", { continued: true, width: 100, align: "center" });
    doc.text("Precio", { align: "right" });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    productos.forEach((p) => {
      doc.text(p.nombre, 50, doc.y, { continued: true, width: 200 });
      doc.text(p.cantidad.toString(), { continued: true, width: 100, align: "center" });
      doc.text(`$${(p.precio * p.cantidad).toFixed(2)}`, { align: "right" });
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    const total = productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
    doc.fontSize(14).text(`Total: $${total.toFixed(2)}`, { align: "right" });

    doc.end();
  });

// Generar HTML para el correo
const generarHTML = (productos, cliente, email) => {
  const filas = productos
    .map(
      (p) => `
        <tr>
          <td style="padding:8px; border:1px solid #ddd;">${p.nombre}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:center;">${p.cantidad}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:right;">$${(p.precio * p.cantidad).toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  const total = productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto;">
      <h2 style="text-align:center; color:#2c3e50;">🧾 Ticket de Compra - Verdulería</h2>
      <p><strong>Cliente:</strong> ${cliente}</p>
      <p><strong>Email:</strong> ${email}</p>
      <table style="width:100%; border-collapse: collapse; margin-top:15px;">
        <thead>
          <tr style="background:#f2f2f2;">
            <th style="padding:8px; border:1px solid #ddd;">Producto</th>
            <th style="padding:8px; border:1px solid #ddd;">Cantidad</th>
            <th style="padding:8px; border:1px solid #ddd;">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
      <h3 style="text-align:right; margin-top:20px;">💰 Total: $${total.toFixed(2)}</h3>
    </div>
  `;
};

export async function handler(event, context) {
  try {
    const body = JSON.parse(event.body);
    const { cliente, email, productos } = body;

    if (!cliente || !productos || productos.length === 0) {
      return { statusCode: 400, body: "Faltan datos de la venta" };
    }

    // Validación de email
    const destinatario = esEmailValido(email) ? email : "pablomas.kpo2389@gmail.com";

    // Generar PDF + HTML
    const pdfBuffer = await generarPDF(productos, cliente, destinatario);
    const htmlBody = generarHTML(productos, cliente, destinatario);

    // Guardar venta en Firestore
    const total = productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
    await addDoc(collection(db, "ventas"), {
      cliente,
      email: destinatario,
      productos,
      total,
      fecha: new Date().toISOString(),
    });

    // Configurar Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Enviar correo con PDF adjunto + HTML
    await transporter.sendMail({
      from: `"Verdulería" <${process.env.SMTP_USER}>`,
      to: destinatario,
      subject: "Tu Ticket de Compra",
      html: htmlBody,
      attachments: [
        {
          filename: "ticket.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return { statusCode: 200, body: "Ticket enviado y guardado en Firestore ✅" };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: "Error: " + error.message };
  }
}
