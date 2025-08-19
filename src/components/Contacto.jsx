import { useState } from "react";

export default function ContactoForm() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEstado("Enviando...");

    try {
      const res = await fetch("/.netlify/functions/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, mensaje }),
      });

      const text = await res.text();

      if (res.ok) {
        setEstado("Mensaje enviado ✅");
        setNombre("");
        setEmail("");
        setMensaje("");
      } else {
        setEstado("Error: " + text);
      }
    } catch (err) {
      setEstado("Error al enviar: " + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <textarea
        placeholder="Mensaje"
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        required
      />
      <button type="submit">Enviar</button>
      <p>{estado}</p>
    </form>
  );
}
