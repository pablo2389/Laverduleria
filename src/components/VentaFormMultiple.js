import React, { useState, forwardRef, useImperativeHandle } from "react";

const VentaFormMultiple = forwardRef(({ productos, onRegistrarVenta }, ref) => {
  const [ventaDetalle, setVentaDetalle] = useState({
    nombre: "Venta múltiple",
    detalle: [],
    total: 0,
    cantidad: 0,
  });

  // Permitir reiniciar desde el ref
  useImperativeHandle(ref, () => ({
    resetForm() {
      setVentaDetalle({ nombre: "Venta múltiple", detalle: [], total: 0, cantidad: 0 });
    },
  }));

  const handleCantidadChange = (producto, cantidad) => {
    let nuevaCantidad = parseFloat(cantidad) || 0;
    let detalleActualizado = ventaDetalle.detalle.filter((d) => d.id !== producto.id);

    if (nuevaCantidad > 0) {
      detalleActualizado.push({
        id: producto.id,
        nombre: producto.nombre,
        cantidad: nuevaCantidad,
        precioUnitario: producto.precio,
        subtotal: nuevaCantidad * producto.precio,
        unidad: producto.unidad,
      });
    }

    const total = detalleActualizado.reduce((acc, item) => acc + item.subtotal, 0);
    const cantidadTotal = detalleActualizado.reduce((acc, item) => acc + item.cantidad, 0);

    setVentaDetalle({
      ...ventaDetalle,
      detalle: detalleActualizado,
      total,
      cantidad: cantidadTotal,
    });
  };

  const handleRegistrarVenta = () => {
    if (ventaDetalle.detalle.length === 0) return alert("Seleccione al menos un producto");
    onRegistrarVenta([], ventaDetalle);
  };

  return (
    <div>
      <h3>Seleccionar productos</h3>
      {productos.map((p) => (
        <div key={p.id} style={{ marginBottom: 8 }}>
          <span>{p.nombre} - ${p.precio.toFixed(2)} ({p.stock.toFixed(2)} {p.unidad}) </span>
          <input
            type="number"
            min="0"
            max={p.stock}
            step="0.1"
            placeholder="Cantidad"
            style={{ width: 60, marginLeft: 10 }}
            onChange={(e) => handleCantidadChange(p, e.target.value)}
          />
        </div>
      ))}

      <p><strong>Total:</strong> ${ventaDetalle.total.toFixed(2)}</p>
      <p><strong>Cantidad total:</strong> {ventaDetalle.cantidad}</p>

      <button
        onClick={handleRegistrarVenta}
        style={{ padding: "8px 15px", borderRadius: 6, backgroundColor: "#007bff", color: "white", border: "none", cursor: "pointer", marginTop: 10 }}
      >
        💰 Registrar Venta
      </button>
    </div>
  );
});

export default VentaFormMultiple;
