// src/components/Contacto.jsx
import React, { useState } from "react";

const Contacto = () => {
  const [formData, setFormData] = useState({ nombre: "", email: "", mensaje: "" });
  const [enviando, setEnviando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensajeEstado("");

    try {
      const response = await fetch("/.netlify/functions/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMensajeEstado("✅ Mensaje enviado correctamente!");
        setFormData({ nombre: "", email: "", mensaje: "" });
      } else {
        const errorText = await response.text();
        setMensajeEstado("⚠️ Error al enviar mensaje: " + errorText);
      }
    } catch (err) {
      setMensajeEstado("⚠️ Error enviando mensaje: " + err.message);
      console.error("Error enviando el mensaje:", err);
    }

    setEnviando(false);
  };

  return (
    <section style={{ marginTop: 40 }}>
      <h2>Contacto</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label>Nombre:</label>
        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        <label>Mensaje:</label>
        <textarea name="mensaje" rows={4} value={formData.mensaje} onChange={handleChange} required></textarea>
        <button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar"}
        </button>
        {mensajeEstado && <p>{mensajeEstado}</p>}
      </form>
    </section>
  );
};

export default Contacto;
