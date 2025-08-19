// src/App.jsx
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

import ProductoForm from "./components/ProductoForm";
import VentaFormMultiple from "./components/VentaFormMultiple";

const convertirDesdeUnidadBase = (stockBase, unidad) => {
  if (unidad === "kg") return stockBase / 1000;
  return stockBase;
};

const convertirAUnidadBase = (stock, precio, unidad) => {
  let stockBase = stock;
  let precioBase = precio;
  if (unidad === "kg") {
    stockBase = stock * 1000;
    precioBase = precio / 1000;
  }
  return { stockBase, precioBase };
};

const App = () => {
  const [productos, setProductos] = useState([]);
  const [mensajeEstado, setMensajeEstado] = useState("");
  const [mensajeVenta, setMensajeVenta] = useState(null);

  // Cargar productos desde Firebase
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const productosCol = collection(db, "productos");
        const snapshot = await getDocs(productosCol);
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

  // Agregar o actualizar producto
  const agregarProducto = async (producto) => {
    try {
      const productosCol = collection(db, "productos");
      const nombreBuscado = producto.nombre.toLowerCase();
      const snapshot = await getDocs(productosCol);
      const productosLista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const existente = productosLista.find(
        (p) => p.nombre.toLowerCase() === nombreBuscado
      );

      const unidad = producto.unidad || "kg";
      const { stockBase, precioBase } = convertirAUnidadBase(
        producto.stock,
        producto.precio,
        unidad
      );

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
        setMensajeEstado(`Producto ${producto.nombre} actualizado con éxito`);
      } else {
        const productoParaGuardar = {
          ...producto,
          unidad,
          stockBase,
          precioBase,
          stock: producto.stock,
        };
        const docRef = await addDoc(productosCol, productoParaGuardar);
        setProductos((prev) => [...prev, { id: docRef.id, ...productoParaGuardar }]);
        setMensajeEstado(`Producto ${producto.nombre} agregado con éxito`);
      }
    } catch (error) {
      setMensajeEstado("Error al agregar producto: " + error.message);
    }
  };

  // Registrar venta y enviar ticket PDF
  const registrarVenta = async (ventasArray) => {
    try {
      let totalVenta = 0;
      const nuevosProductos = productos.map((p) => ({ ...p }));
      const detalleVenta = [];

      for (const venta of ventasArray) {
        const { productoId, cantidad } = venta;
        const producto = nuevosProductos.find((p) => p.id === productoId);
        if (!producto) throw new Error("Producto no encontrado");

        let cantidadStockBase = cantidad;
        let cantidadParaPrecio = cantidad;

        if (producto.unidad === "grs") {
          cantidadParaPrecio = cantidad / 1000;
          cantidadStockBase = cantidad;
        } else if (producto.unidad === "kg") {
          cantidadStockBase = cantidad * 1000;
        }

        if (cantidadStockBase > producto.stockBase) {
          setMensajeEstado(`Stock insuficiente para ${producto.nombre}`);
          return;
        }

        producto.stockBase -= cantidadStockBase;
        producto.stock = convertirDesdeUnidadBase(producto.stockBase, producto.unidad);

        // Guardar venta en Firebase
        const ventasCol = collection(db, "ventas");
        await addDoc(ventasCol, {
          productoId: producto.id,
          nombre: producto.nombre,
          precioUnitario: producto.precio,
          cantidad: cantidad,
          unidad: producto.unidad,
          total: cantidadParaPrecio * producto.precio,
          fecha: serverTimestamp(),
        });

        detalleVenta.push({
          nombre: producto.nombre,
          cantidad,
          unidad: producto.unidad,
          precioUnitario: producto.precio,
          subtotal: cantidadParaPrecio * producto.precio,
        });

        const productoRef = doc(db, "productos", producto.id);
        await updateDoc(productoRef, { stockBase: producto.stockBase, stock: producto.stock });

        totalVenta += cantidadParaPrecio * producto.precio;
      }

      setProductos(nuevosProductos);
      setMensajeVenta({
        nombre: "Venta múltiple",
        cantidad: ventasArray.reduce((a, v) => a + v.cantidad, 0),
        total: totalVenta,
        detalle: detalleVenta,
      });
      setMensajeEstado("Venta registrada con éxito");

      // Enviar ticket PDF al email usando Netlify Function
      const ventaParaEmail = {
        cliente: "Cliente",
        email: "cliente@correo.com", // aquí podrías usar un input para email
        productos: detalleVenta.map((v) => ({
          nombre: v.nombre,
          cantidad: v.cantidad,
          precio: v.precioUnitario,
          subtotal: v.subtotal,
        })),
        total: totalVenta,
      };

      await fetch("/.netlify/functions/enviar-ticket", {
        method: "POST",
        body: JSON.stringify(ventaParaEmail),
      });
    } catch (error) {
      setMensajeEstado("Error al registrar venta: " + error.message);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20, fontFamily: "Arial" }}>
      <h1>🛒 Verdulería - Caja Registradora</h1>

      {mensajeEstado && (
        <div
          style={{
            backgroundColor: "#f0f0f0",
            padding: 10,
            borderRadius: 6,
            marginBottom: 20,
          }}
        >
          {mensajeEstado}
        </div>
      )}

      <section>
        <h2>Agregar producto</h2>
        <ProductoForm onAgregar={agregarProducto} />
      </section>

      <section>
        <VentaFormMultiple productos={productos} onRegistrarVenta={registrarVenta} />
        {mensajeVenta && (
          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: 10,
              borderRadius: 6,
              marginTop: 20,
              maxHeight: 200,
              overflowY: "auto",
              color: "white",
            }}
          >
            <p>
              Venta registrada: {mensajeVenta.nombre} - Cantidad: {mensajeVenta.cantidad} - Total: $
              {mensajeVenta.total.toFixed(2)}
            </p>
            <h3>Detalle de la venta:</h3>
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {mensajeVenta.detalle?.map((item, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {item.nombre} — {item.cantidad} {item.unidad} × ${item.precioUnitario.toFixed(2)} ={" "}
                  <strong>${item.subtotal.toFixed(2)}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
};

export default App;
