import { forwardRef, useImperativeHandle, useState } from "react";

const VentaFormMultiple = forwardRef(({ productos, onRegistrarVenta }, ref) => {
  // Única fuente de verdad: el array de items cargados.
  // El total y la cantidad SIEMPRE se calculan a partir de este array,
  // nunca se guardan aparte, así no pueden quedar desincronizados.
  const [detalle, setDetalle] = useState([]);

  const total = detalle.reduce((acc, item) => acc + item.subtotal, 0);
  const cantidadTotal = detalle.reduce((acc, item) => acc + item.cantidad, 0);

  useImperativeHandle(ref, () => ({
    resetForm() {
      setDetalle([]);
    },
  }));

  const handleCantidadChange = (producto, cantidad) => {
    const nuevaCantidad = parseFloat(cantidad) || 0;
    const detalleActualizado = detalle.filter((d) => d.id !== producto.id);

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

    setDetalle(detalleActualizado);
  };

  // Sacar un producto del carrito en vivo
  const quitarDelCarrito = (id) => {
    setDetalle((prev) => prev.filter((d) => d.id !== id));
  };

  const handleRegistrarVenta = () => {
    if (detalle.length === 0) return alert("Seleccione al menos un producto");
    const ventaDetalle = {
      nombre: "Venta múltiple",
      detalle,
      total,
      cantidad: cantidadTotal,
    };
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

      {/* 🛒 Carrito en vivo: se va llenando a medida que el cajero carga cantidades */}
      <div
        style={{
          marginTop: 20,
          padding: 12,
          border: "2px solid #007bff",
          borderRadius: 8,
          backgroundColor: "#f8f9fa",
        }}
      >
        <h4 style={{ marginTop: 0, color: "#007bff" }}>🛒 Venta actual</h4>

        {detalle.length === 0 ? (
          <p style={{ color: "#888", fontStyle: "italic" }}>
            Todavía no cargaste ningún producto.
          </p>
        ) : (
          <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
            {detalle.map((item) => (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px solid #ddd",
                }}
              >
                <span>
                  {item.nombre} — {item.cantidad} {item.unidad} × ${item.precioUnitario.toFixed(2)}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <strong>${item.subtotal.toFixed(2)}</strong>
                  <button
                    onClick={() => quitarDelCarrito(item.id)}
                    title="Quitar de la venta"
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#dc3545",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                  >
                    ✖
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "2px solid #007bff",
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            fontSize: 18,
          }}
        >
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={handleRegistrarVenta}
        style={{ padding: "8px 15px", borderRadius: 6, backgroundColor: "#007bff", color: "white", border: "none", cursor: "pointer", marginTop: 15 }}
      >
        💰 Registrar Venta
      </button>
    </div>
  );
});

export default VentaFormMultiple;