import React, { useState, useEffect } from "react";

const VentaFormMultiple = ({ productos, onRegistrarVenta, clienteNombre, clienteEmail }) => {
  const [cantidades, setCantidades] = useState({});
  const [ventaTotal, setVentaTotal] = useState(0);

  const handleCantidadChange = (id, value) => {
    const num = Number(value);
    if (num < 0) return;
    setCantidades({ ...cantidades, [id]: num });
  };

  useEffect(() => {
    let total = 0;
    for (const producto of productos) {
      const cantidad = cantidades[producto.id] || 0;
      if (cantidad > 0) {
        let subtotal =
          producto.unidad === "grs"
            ? producto.precio * (cantidad / 1000)
            : producto.precio * cantidad;
        total += subtotal;
      }
    }
    setVentaTotal(total);
  }, [cantidades, productos]);

  const registrarVentaClick = async () => {
    const ventasArray = Object.entries(cantidades)
      .filter(([_, cantidad]) => cantidad > 0)
      .map(([id, cantidad]) => {
        const prod = productos.find((p) => p.id === id);
        if (cantidad > prod.stock) {
          alert(`No hay suficiente stock de ${prod.nombre}`);
          throw new Error("Stock insuficiente");
        }
        return { productoId: id, cantidad };
      });

    if (ventasArray.length === 0) {
      alert("Ingrese al menos una cantidad para registrar la venta.");
      return;
    }

    // Armamos detalle de venta para mostrar en la app
    const detalleVenta = ventasArray.map(({ productoId, cantidad }) => {
      const p = productos.find((prod) => prod.id === productoId);
      const subtotal =
        p.unidad === "grs" ? p.precio * (cantidad / 1000) : p.precio * cantidad;
      return {
        nombre: p.nombre,
        cantidad,
        unidad: p.unidad,
        precioUnitario: p.precio,
        subtotal,
      };
    });

    const totalVenta = detalleVenta.reduce((acc, item) => acc + item.subtotal, 0);

    // Llamamos a la función de App.jsx pasando también el detalle
    onRegistrarVenta(
      ventasArray,
      {
        nombre: "Venta múltiple",
        cantidad: ventasArray.reduce((a, v) => a + v.cantidad, 0),
        total: totalVenta,
        detalle: detalleVenta,
      }
    );

    // Enviar ticket por correo
    const venta = {
      cliente: clienteNombre || "Cliente",
      email: clienteEmail || "cliente@correo.com",
      productos: detalleVenta.map((item) => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: item.precioUnitario,
      })),
    };

    try {
      const response = await fetch("/.netlify/functions/enviar-ticket", {
        method: "POST",
        body: JSON.stringify(venta),
      });
      const text = await response.text();
      alert(text);
    } catch (error) {
      console.error(error);
      alert("Error enviando ticket: " + error.message);
    }

    setCantidades({});
    setVentaTotal(0);
  };

  const reiniciar = () => {
    setCantidades({});
    setVentaTotal(0);
  };

  const hayVentas = Object.values(cantidades).some((cantidad) => cantidad > 0);

  return (
    <div>
      <h2>🧾 Registrador de ventas múltiples</h2>
      {productos.map((producto) => (
        <div key={producto.id} style={{ marginBottom: "10px" }}>
          <strong>{producto.nombre}</strong> - Stock: {producto.stock.toFixed(3)}{" "}
          {producto.unidad} - $ {producto.precio.toFixed(2)}
          <br />
          Cantidad ({producto.unidad === "grs" ? "grs" : "kg"}):{" "}
          <input
            type="number"
            min="0"
            value={cantidades[producto.id] || ""}
            onChange={(e) => handleCantidadChange(producto.id, e.target.value)}
          />
        </div>
      ))}
      <button
        onClick={registrarVentaClick}
        disabled={!hayVentas}
        style={{
          cursor: hayVentas ? "pointer" : "not-allowed",
          opacity: hayVentas ? 1 : 0.6,
          marginRight: "10px",
          padding: "8px 12px",
        }}
      >
        💰 Registrar Venta
      </button>
      <button onClick={reiniciar} style={{ padding: "8px 12px" }}>
        🧹 Reiniciar
      </button>
      <h3>🧾 Venta total: $ {ventaTotal.toFixed(2)}</h3>
    </div>
  );
};

export default VentaFormMultiple;
