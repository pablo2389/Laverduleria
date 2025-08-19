import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../netlify/functions/firebaseConfig";

const OfertasAdmin = () => {
  const [ofertas, setOfertas] = useState([]);
  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "", precio: "", activo: true });

  const cargarOfertas = async () => {
    const snapshot = await getDocs(collection(db, "ofertas"));
    setOfertas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { cargarOfertas(); }, []);

  const agregarOferta = async () => {
    await addDoc(collection(db, "ofertas"), nuevo);
    setNuevo({ nombre: "", descripcion: "", precio: "", activo: true });
    cargarOfertas();
  };

  const toggleActivo = async (id, valor) => {
    const ref = doc(db, "ofertas", id);
    await updateDoc(ref, { activo: valor });
    cargarOfertas();
  };

  const eliminarOferta = async (id) => {
    await deleteDoc(doc(db, "ofertas", id));
    cargarOfertas();
  };

  return (
    <div>
      <h2>Administrar Ofertas</h2>
      <input placeholder="Nombre" value={nuevo.nombre} onChange={e => setNuevo({...nuevo, nombre:e.target.value})} />
      <input placeholder="Descripción" value={nuevo.descripcion} onChange={e => setNuevo({...nuevo, descripcion:e.target.value})} />
      <input placeholder="Precio" value={nuevo.precio} onChange={e => setNuevo({...nuevo, precio:e.target.value})} />
      <button onClick={agregarOferta}>Agregar</button>

      <ul>
        {ofertas.map(o => (
          <li key={o.id}>
            {o.nombre} - {o.descripcion} - {o.precio} - {o.activo ? "Activo" : "Inactivo"}
            <button onClick={() => toggleActivo(o.id, !o.activo)}>Toggle</button>
            <button onClick={() => eliminarOferta(o.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OfertasAdmin;
