import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "./firebaseConfig";

import Contacto from "./components/Contacto";
import ListadoProductos from "./components/ListadoProductos";
import ProductoForm from "./components/ProductoForm";
import VentaFormMultiple from "./components/VentaFormMultiple";

// Conversiones
const convertirDesdeUnidadBase = (stockBase, unidad) =>
  unidad === "kg" ? stockBase / 1000 : stockBase;

const convertirAUnidadBase = (stock, precio, unidad) => {
  let stockBase = stock,
    precioBase = precio;
  if (unidad === "kg") {
    stockBase = stock * 1000;
    precioBase = precio / 1000;
  }
  return { stockBase, precioBase };
};

// Normaliza nombres para comparar sin importar tildes/mayúsculas
// (evita que "papas" y "papás" se guarden como productos distintos)
const normalizarNombre = (str) =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

// Función para enviar PDF o venta al backend
const enviarVenta = async (venta) => {
  try {
    const url =
      process.env.NODE_ENV === "development"
        ? "http://localhost:8888/.netlify/functions/enviar-ticket"
        : "/.netlify/functions/enviar-ticket";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venta }),
    });

    const text = await res.text();
    if (!res.ok) throw new Error(text);
    console.log(text);
  } catch (err) {
    console.error("Error al enviar venta:", err.message);
  }
};

// Arma el texto plano del ticket para compartir por WhatsApp
const buildTicketWhatsApp = (ventaDetalle) => {
  const fecha = new Date().toLocaleString("es-AR");
  let texto = `🧾 *Ticket de compra - Tu Verdulería*\n`;
  texto += `Fecha: ${fecha}\n\n`;
  texto += `Detalle:\n`;
  (ventaDetalle.detalle || []).forEach((item) => {
    texto += `- ${item.nombre}: ${item.cantidad} ${item.unidad} x $${item.precioUnitario.toFixed(
      2
    )} = $${item.subtotal.toFixed(2)}\n`;
  });
  texto += `\n*Total: $${(ventaDetalle.total || 0).toFixed(2)}*\n`;
  texto += `\n¡Gracias por tu compra!`;
  return texto;
};

const App = () => {
  const [productos, setProductos] = useState([]);
  const [mensajeVenta, setMensajeVenta] = useState(null);
  const [ventasAcumuladas, setVentasAcumuladas] = useState(0);
  const [mensajeEstado, setMensajeEstado] = useState("");
  const ventaFormRef = useRef(null);

  // Cargar productos
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const snapshot = await getDocs(collection(db, "productos"));
        const lista = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            unidad: data.unidad || "kg",
            stock: convertirDesdeUnidadBase(data.stockBase || 0, data.unidad || "kg"),
          };
        });
        setProductos(lista);
      } catch (error) {
        setMensajeEstado("Error cargando productos: " + error.message);
      }
    };
    cargarProductos();
  }, []);

  // CRUD productos
  const agregarProducto = async (producto) => {
    try {
      const snapshot = await getDocs(collection(db, "productos"));
      // Comparación sin tildes/mayúsculas, para que "papas" y "papás"
      // se traten como el mismo producto (fix de duplicados)
      const existente = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .find((p) => normalizarNombre(p.nombre) === normalizarNombre(producto.nombre));

      const unidad = producto.unidad || "kg";
      const { stockBase, precioBase } = convertirAUnidadBase(producto.stock, producto.precio, unidad);

      if (existente) {
        const productoRef = doc(db, "productos", existente.id);
        await updateDoc(productoRef, {
          precio: producto.precio,
          stockBase: (existente.stockBase || 0) + stockBase,
          unidad,
          precioBase,
          stock: convertirDesdeUnidadBase((existente.stockBase || 0) + stockBase, unidad),
        });
        setProductos((prev) =>
          prev.map((p) =>
            p.id === existente.id
              ? {
                  ...p,
                  precio: producto.precio,
                  stockBase: (p.stockBase || 0) + stockBase,
                  unidad,
                  precioBase,
                  stock: convertirDesdeUnidadBase((p.stockBase || 0) + stockBase, unidad),
                }
              : p
          )
        );
        setMensajeEstado(`Producto ${producto.nombre} actualizado con éxito (sumado a "${existente.nombre}")`);
      } else {
        const productoParaGuardar = { ...producto, unidad, stockBase, precioBase, stock: producto.stock };
        const docRef = await addDoc(collection(db, "productos"), productoParaGuardar);
        setProductos((prev) => [...prev, { id: docRef.id, ...productoParaGuardar }]);
        setMensajeEstado(`Producto ${producto.nombre} agregado con éxito`);
      }
    } catch (error) {
      setMensajeEstado("Error al agregar producto: " + error.message);
    }
  };

  // Actualizar precio o stock editado a mano en la lista
  const actualizarProducto = async (id, campo, valor) => {
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;

    const valorNumerico = parseFloat(valor);
    if (valor !== "" && isNaN(valorNumerico)) return;

    try {
      if (campo === "precio") {
        const nuevoPrecio = valor === "" ? 0 : valorNumerico;
        await updateDoc(doc(db, "productos", id), { precio: nuevoPrecio });
        setProductos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, precio: nuevoPrecio } : p))
        );
      } else if (campo === "stock") {
        const nuevoStock = valor === "" ? 0 : valorNumerico;
        const { stockBase } = convertirAUnidadBase(nuevoStock, producto.precio, producto.unidad);
        await updateDoc(doc(db, "productos", id), { stockBase, stock: nuevoStock });
        setProductos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stockBase, stock: nuevoStock } : p))
        );
      }
    } catch (error) {
      setMensajeEstado("Error al actualizar producto: " + error.message);
    }
  };

  // Botones ➕ / ➖ : suman o restan 1 unidad (kg o unidad) de stock
  const ajustarStock = async (id, delta) => {
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;

    const deltaBase = producto.unidad === "kg" ? delta * 1000 : delta;
    const nuevoStockBase = Math.max(0, (producto.stockBase || 0) + deltaBase);
    const nuevoStock = convertirDesdeUnidadBase(nuevoStockBase, producto.unidad);

    try {
      await updateDoc(doc(db, "productos", id), {
        stockBase: nuevoStockBase,
        stock: nuevoStock,
      });
      setProductos((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, stockBase: nuevoStockBase, stock: nuevoStock } : p
        )
      );
    } catch (error) {
      setMensajeEstado("Error al ajustar stock: " + error.message);
    }
  };

  // Botón "Quitar": borra el producto de Firestore y de la lista
  const eliminarProducto = async (id) => {
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;
    const confirmar = window.confirm(`¿Seguro que querés quitar "${producto.nombre}"?`);
    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "productos", id));
      setProductos((prev) => prev.filter((p) => p.id !== id));
      setMensajeEstado(`Producto ${producto.nombre} eliminado`);
    } catch (error) {
      setMensajeEstado("Error al eliminar producto: " + error.message);
    }
  };

  // Registrar venta
  const registrarVenta = async (ventasArray, ventaDetalle) => {
    try {
      const totalVenta = ventaDetalle.total || 0;
      setVentasAcumuladas((prev) => prev + totalVenta);
      setMensajeVenta(ventaDetalle);

      const nuevosProductos = productos.map((p) => ({ ...p }));

      for (const item of ventaDetalle.detalle) {
        const prod = nuevosProductos.find((p) => p.id === item.id);
        if (!prod) continue;
        const cantidadStockBase = prod.unidad === "kg" ? item.cantidad * 1000 : item.cantidad;
        prod.stockBase -= cantidadStockBase;
        prod.stock = convertirDesdeUnidadBase(prod.stockBase, prod.unidad);
        await updateDoc(doc(db, "productos", prod.id), { stockBase: prod.stockBase, stock: prod.stock });
      }

      setProductos(nuevosProductos);
      setMensajeEstado("Venta registrada con éxito");

      // Enviar venta al backend para PDF/email
      await enviarVenta(ventaDetalle);
    } catch (error) {
      setMensajeEstado("Error al registrar venta: " + error.message);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20, fontFamily: "Arial" }}>
      <h1>🛒 Verdulería - Caja Registradora</h1>

      {mensajeEstado && (
        <div style={{ backgroundColor: "#f0f0f0", padding: 10, borderRadius: 6, marginBottom: 20, color: "black" }}>
          {mensajeEstado}
        </div>
      )}

      <section>
        <h2>Agregar producto</h2>
        <ProductoForm onAgregar={agregarProducto} />
      </section>

      <section>
        <ListadoProductos
          productos={productos}
          onActualizar={actualizarProducto}
          onAjustarStock={ajustarStock}
          onEliminarProducto={eliminarProducto}
        />
      </section>

      <section>
        <VentaFormMultiple ref={ventaFormRef} productos={productos} onRegistrarVenta={registrarVenta} />

        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => {
              if (ventaFormRef.current) ventaFormRef.current.resetForm?.();
              setMensajeVenta(null);
              setMensajeEstado("Formulario reiniciado");
            }}
          >
            💫 Reiniciar
          </button>

          <button
            style={{ padding: "8px 15px", borderRadius: 6, backgroundColor: "#28a745", color: "white", border: "none", cursor: "pointer", marginLeft: 10 }}
            onClick={async () => {
              if (!mensajeVenta) return alert("No hay venta registrada");
              await enviarVenta(mensajeVenta);
              setMensajeEstado("PDF enviado correctamente");
            }}
          >
            📄 Enviar PDF
          </button>

          {mensajeVenta && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(buildTicketWhatsApp(mensajeVenta))}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "8px 15px",
                borderRadius: 6,
                backgroundColor: "#25D366",
                color: "white",
                border: "none",
                cursor: "pointer",
                marginLeft: 10,
                textDecoration: "none",
              }}
            >
              📱 Enviar por WhatsApp
            </a>
          )}
        </div>

        {mensajeVenta && (
          <div style={{ backgroundColor: "rgba(0,0,0,0.5)", padding: 10, borderRadius: 6, marginTop: 20, maxHeight: 250, overflowY: "auto", color: "white" }}>
            <p>
              Venta registrada: {mensajeVenta.nombre} - Cantidad: {mensajeVenta.cantidad} - Total: ${mensajeVenta.total.toFixed(2)}
            </p>
            <p><strong>Total acumulado:</strong> ${ventasAcumuladas.toFixed(2)}</p>

            <h3>Detalle de la venta:</h3>
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {mensajeVenta.detalle?.map((item, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {item.nombre} — {item.cantidad} {item.unidad} × ${item.precioUnitario.toFixed(2)} = <strong>${item.subtotal.toFixed(2)}</strong>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 10 }}>
              <input
                type="email"
                placeholder="Email para enviar ticket"
                value={mensajeVenta.email || ""}
                onChange={(e) => setMensajeVenta((prev) => ({ ...prev, email: e.target.value }))}
                style={{ padding: 5, borderRadius: 4, width: "100%" }}
              />
            </div>
          </div>
        )}
      </section>

      <section style={{ marginTop: 30 }}>
        <h2>Contacto</h2>
        <Contacto />
      </section>
    </div>
  );
};

export default App;