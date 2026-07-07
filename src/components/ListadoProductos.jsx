import { useState } from "react";

const ListadoProductos = ({ productos, onActualizar, onAjustarStock, onEliminarProducto }) => {
  // Valores "en edición" mientras el cajero escribe, separados del valor real
  // guardado en Firestore. Así la escritura a la base solo ocurre al salir
  // del campo (onBlur), no en cada tecla.
  const [edicionLocal, setEdicionLocal] = useState({});

  const validarNumero = (valor, decimales) => {
    const regex = new RegExp(`^\\d*(\\.\\d{0,${decimales}})?$`);
    return regex.test(valor);
  };

  const claveEdicion = (id, campo) => `${id}-${campo}`;

  const handleChange = (id, campo, e) => {
    const val = e.target.value;
    if (campo === "precio" && !validarNumero(val, 2)) return;
    if (campo === "stock" && !validarNumero(val, 3)) return;
    // Solo actualiza el valor mostrado en pantalla, todavía no toca Firestore
    setEdicionLocal((prev) => ({ ...prev, [claveEdicion(id, campo)]: val }));
  };

  const handleBlur = (id, campo, valorOriginal) => {
    const clave = claveEdicion(id, campo);
    const valorEditado = edicionLocal[clave];
    // Si no se tocó nada, o quedó igual al original, no hace falta escribir a la DB
    if (valorEditado === undefined || String(valorEditado) === String(valorOriginal)) {
      setEdicionLocal((prev) => {
        const copia = { ...prev };
        delete copia[clave];
        return copia;
      });
      return;
    }
    onActualizar(id, campo, valorEditado);
    setEdicionLocal((prev) => {
      const copia = { ...prev };
      delete copia[clave];
      return copia;
    });
  };

  return (
    <div>
      <h2>Productos</h2>
      {productos.length === 0 ? (
        <p>No hay productos.</p>
      ) : (
        productos.map(({ id, nombre, precio, stock, unidad }) => {
          const valorPrecio =
            edicionLocal[claveEdicion(id, "precio")] !== undefined
              ? edicionLocal[claveEdicion(id, "precio")]
              : precio;
          const valorStock =
            edicionLocal[claveEdicion(id, "stock")] !== undefined
              ? edicionLocal[claveEdicion(id, "stock")]
              : stock;

          return (
            <div
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 6,
              }}
            >
              <div style={{ flex: 2, fontWeight: "bold" }}>{nombre}</div>
              <input
                type="text"
                value={valorPrecio}
                onChange={(e) => handleChange(id, "precio", e)}
                onBlur={() => handleBlur(id, "precio", precio)}
                style={{ width: 100 }}
                title="Precio por kilo"
              />
              <input
                type="text"
                value={valorStock}
                onChange={(e) => handleChange(id, "stock", e)}
                onBlur={() => handleBlur(id, "stock", stock)}
                style={{ width: 100 }}
                title="Stock en kilos"
              />
              <div>{unidad}</div>

              <button onClick={() => onAjustarStock(id, +1)}>➕</button>
              <button onClick={() => onAjustarStock(id, -1)} disabled={stock <= 0}>
                ➖
              </button>

              <button
                onClick={() => onEliminarProducto(id)}
                style={{
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: 4,
                  cursor: "pointer",
                  marginLeft: 10,
                }}
                title="Quitar producto"
              >
                Quitar
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ListadoProductos;