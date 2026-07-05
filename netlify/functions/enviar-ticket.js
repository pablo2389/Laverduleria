import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";

export const handler = async (event) => {
  try {
    const { cliente, email, productos } = JSON.parse(event.body);

    // 1️⃣ Crear PDF en memoria
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const endPromise = new Promise((resolve) => doc.on("end", resolve));

    doc.fontSize(20).text(`Ticket de Compra - ${cliente}`, { align: "center" });
    doc.moveDown();

    let total = 0;
    productos.forEach((p, i) => {
      const subtotal = p.cantidad * p.precio;
      total += subtotal;
      doc.fontSize(12).text(
        `${i + 1}. ${p.nombre} — ${p.cantidad} × $${p.precio.toFixed(2)} = $${subtotal.toFixed(2)}`
      );
    });

    doc.moveDown().fontSize(16).text(`Total: $${total.toFixed(2)}`, { align: "right" });
    doc.end();
    await endPromise;

    const pdfBuffer = Buffer.concat(chunks);

    // 2️⃣ Configurar nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // contraseña de app
      },
    });

    // 3️⃣ Enviar correo con PDF adjunto
    await transporter.sendMail({
      from: `"Verdulería" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Ticket de compra - ${cliente}`,
      text: `Hola ${cliente}, adjunto tu ticket de compra.`,
      attachments: [{ filename: "ticket.pdf", content: pdfBuffer }],
    });

    return { statusCode: 200, body: `Ticket enviado a ${email}` };
  } catch (error) {
    console.error("Error en enviar-ticket:", error);
    return { statusCode: 500, body: "Error enviando ticket: " + error.message };
  }
};
