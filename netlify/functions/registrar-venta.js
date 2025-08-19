import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import { writeFileSync } from "fs";

export async function handler(event, context) {
  try {
    // 1️⃣ Datos de ejemplo (reemplazar con los reales de la venta)
    const venta = {
      cliente: "Pablo Dario",
      email: "pablomas.kpo2389@gmail.com",
      productos: [
        { nombre: "Frutillas", cantidad: 2, precio: 6000 },
        { nombre: "Papas", cantidad: 1, precio: 700 }
      ],
      total: 12700
    };

    // 2️⃣ Generar PDF
    const doc = new PDFDocument();
    const fileName = `/tmp/ticket-${Date.now()}.pdf`; // carpeta temporal
    doc.pipe(writeFileSync(fileName)); // guardamos temporalmente

    doc.fontSize(20).text("🧾 Ticket de Compra Verdulería", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Cliente: ${venta.cliente}`);
    doc.text(`Email: ${venta.email}`);
    doc.moveDown();

    venta.productos.forEach(p => {
      doc.text(`${p.nombre} - Cant: ${p.cantidad} - Precio: $${p.precio}`);
    });

    doc.moveDown();
    doc.text(`💰 Total: $${venta.total}`);
    doc.end();

    // 3️⃣ Enviar PDF por correo
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"Verdulería" <${process.env.SMTP_USER}>`,
      to: venta.email,
      subject: "Tu Ticket de Compra 🧾",
      text: "Adjunto tu ticket de compra",
      attachments: [
        {
          filename: "ticket.pdf",
          path: fileName
        }
      ]
    });

    return { statusCode: 200, body: "Ticket enviado ✅" };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: "Error: " + error.message };
  }
}
