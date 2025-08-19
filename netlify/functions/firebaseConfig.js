// firebaseConfig.js
const { initializeApp, getApps } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBWDaudDwnVeqSJ-b4vYbWBylQt0HqJ_eI",
  authDomain: "verduras-frutas.firebaseapp.com",
  projectId: "verduras-frutas",
  storageBucket: "verduras-frutas.appspot.com",
  messagingSenderId: "253939309797",
  appId: "1:253939309797:web:db91c054fc56576e04880c",
};

// Inicializar Firebase solo si no hay apps existentes
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Exportar Firestore
const db = getFirestore(app);

module.exports = { db };
