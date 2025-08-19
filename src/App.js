// src/App.jsx
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebaseConfig"; // apunta al src/firebaseConfig.js


import Contacto from "./components/Contacto";
import ListadoProductos from "./components/ListadoProductos";
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
  const [mensajeVenta, setMensajeVenta] = useState(null);
  const [ventasAcumuladas, setVentasAcumuladas] = useState(0);
  const [mensajeEstado, setMensajeEstado] = useState("");

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

  const agregarProducto = async (producto) => {
    try {
      const productosCol = collection(db, "productos");
      const nombreBuscado = producto.nombre.toLowerCase();
      const snapshot = await getDocs(productosCol);
      const productosLista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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
          unidad: unidad,
          precioBase,
          stock: convertirDesdeUnidadBase(
            (existente.stockBase || 0) + stockBase,
            unidad
          ),
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
                  stock: convertirDesdeUnidadBase(
                    (p.stockBase || 0) + stockBase,
                    unidad
                  ),
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
        setProductos((prev) => [
          ...prev,
          { id: docRef.id, ...productoParaGuardar },
        ]);
        setMensajeEstado(`Producto ${producto.nombre} agregado con éxito`);
      }
    } catch (error) {
      setMensajeEstado("Error al agregar producto: " + error.message);
    }
  };

  const actualizarProducto = async (id, campo, valor) => {
    const prod = productos.find((p) => p.id === id);
    if (!prod) return;

    let valorParseado;
    if (campo === "precio") {
      valorParseado = parseFloat(valor);
      if (isNaN(valorParseado) || valorParseado <= 0) return;
    } else if (campo === "stock") {
      valorParseado = parseFloat(valor);
      if (isNaN(valorParseado) || valorParseado < 0) return;
    } else {
      valorParseado = valor;
    }

    try {
      const productoRef = doc(db, "productos", id);
      let updateData = { [campo]: valorParseado };

      if (campo === "stock") {
        const nuevoStockBase = convertirAUnidadBase(
          valorParseado,
          prod.precio,
          prod.unidad
        ).stockBase;
        updateData.stockBase = nuevoStockBase;
      }
      if (campo === "precio") {
        const nuevoPrecioBase = convertirAUnidadBase(
          prod.stock,
          valorParseado,
          prod.unidad
        ).precioBase;
        updateData.precioBase = nuevoPrecioBase;
      }
      if (campo === "unidad") {
        const { stockBase, precioBase } = convertirAUnidadBase(
          prod.stock,
          prod.precio,
          valorParseado
        );
        updateData.stockBase = stockBase;
        updateData.precioBase = precioBase;
      }

      await updateDoc(productoRef, updateData);

      setProductos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updateData } : p))
      );
      setMensajeEstado(`Producto ${prod.nombre} actualizado`);
    } catch (error) {
      setMensajeEstado("Error al actualizar producto: " + error.message);
    }
  };

  const ajustarStock = async (id, incremento) => {
    const prod = productos.find((p) => p.id === id);
    if (!prod) return;

    let incrementoBase = incremento;
    if (prod.unidad === "kg") incrementoBase = incremento * 1000;

    const nuevoStockBase = prod.stockBase + incrementoBase;
    if (nuevoStockBase < 0) {
      setMensajeEstado(`Stock insuficiente para ${prod.nombre}`);
      return;
    }

    try {
      const productoRef = doc(db, "productos", id);
      const nuevoStockOriginal = convertirDesdeUnidadBase(
        nuevoStockBase,
        prod.unidad
      );

      await updateDoc(productoRef, {
        stockBase: nuevoStockBase,
        stock: nuevoStockOriginal,
      });

      setProductos((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, stockBase: nuevoStockBase, stock: nuevoStockOriginal }
            : p
        )
      );
      setMensajeEstado(`Stock de ${prod.nombre} ajustado`);
    } catch (error) {
      setMensajeEstado("Error al ajustar stock: " + error.message);
    }
  };

  const eliminarProducto = async (id) => {
    const prod = productos.find((p) => p.id === id);
    if (!prod) return;
    const confirmar = window.confirm(`¿Eliminar ${prod.nombre}?`);
    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "productos", id));
      setProductos((prev) => prev.filter((p) => p.id !== id));
      setMensajeEstado(`Producto ${prod.nombre} eliminado`);
    } catch (error) {
      setMensajeEstado("Error al eliminar producto: " + error.message);
    }
  };

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
        producto.stock = convertirDesdeUnidadBase(
          producto.stockBase,
          producto.unidad
        );

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
        await updateDoc(productoRef, {
          stockBase: producto.stockBase,
          stock: producto.stock,
        });

        totalVenta += cantidadParaPrecio * producto.precio;
      }

      setProductos(nuevosProductos);
      setVentasAcumuladas((prev) => prev + totalVenta);
      setMensajeVenta({
        nombre: "Venta múltiple",
        cantidad: ventasArray.reduce((a, v) => a + v.cantidad, 0),
        total: totalVenta,
        detalle: detalleVenta,
      });
      setMensajeEstado("Venta registrada con éxito");
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
            color: "black",
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
        <ListadoProductos
          productos={productos}
          onActualizar={actualizarProducto}
          onAjustarStock={ajustarStock}
          onEliminarProducto={eliminarProducto}
        />
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

      <section>
        <Contacto />
      </section>

      <footer
        style={{
          position: "sticky",
          bottom: 0,
          backgroundColor: "#f0f0f0",
          padding: 10,
          marginTop: 40,
        }}
      >
        <p>
          Ventas acumuladas: <strong>${ventasAcumuladas.toFixed(2)}</strong>
        </p>
      </footer>
    </div>
  );
};

export default App;
