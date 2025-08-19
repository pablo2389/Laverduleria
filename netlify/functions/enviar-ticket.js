import { db } from "./firebaseConfig"; // apunta al mismo folder
import { collection, getDocs } from "firebase/firestore";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit"; // solo si generas PDF

const generarPDF = (productos, cliente, email) =>
  new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    // Título
    doc.fontSize(20).text("🧾 Ticket de Compra Verdulería", { align: "center" });
    doc.moveDown();

    // Datos del cliente
    doc.fontSize(14).text(`Cliente: ${cliente}`);
    doc.text(`Email: ${email}`);
    doc.moveDown();

    // Encabezado de tabla
    doc.fontSize(12).text("Producto", { continued: true, width: 200 });
    doc.text("Cantidad", { continued: true, width: 100, align: "center" });
    doc.text("Precio", { align: "right" });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // Productos
    productos.forEach((p) => {
      doc.text(p.nombre, 50, doc.y, { continued: true, width: 200 });
      doc.text(p.cantidad.toString(), { continued: true, width: 100, align: "center" });
      doc.text(`$${(p.precio * p.cantidad).toFixed(2)}`, { align: "right" });
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // Total
    const total = productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
    doc.fontSize(14).text(`💰 Total: $${total.toFixed(2)}`, { align: "right" });

    doc.end();
  });

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { cliente, email, productos } = body;

    if (!cliente || !email || !productos || productos.length === 0) {
      return { statusCode: 400, body: "Faltan datos de la venta" };
    }

    // Generar PDF
    const pdfBuffer = await generarPDF(productos, cliente, email);

    // Configurar Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Enviar correo con el ticket
    await transporter.sendMail({
      from: `"Verdulería" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Tu Ticket de Compra 🧾",
      text: "Adjunto tu ticket de compra",
      attachments: [
        {
          filename: "ticket.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return { statusCode: 200, body: "Ticket enviado ✅" };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: "Error: " + error.message };
  }
};
