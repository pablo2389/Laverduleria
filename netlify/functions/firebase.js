// netlify/functions/firebaseConfig.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWDaudDwnVeqSJ-b4vYbWBylQt0HqJ_eI",
  authDomain: "verduras-frutas.firebaseapp.com",
  projectId: "verduras-frutas",
  storageBucket: "verduras-frutas.appspot.com",
  messagingSenderId: "253939309797",
  appId: "1:253939309797:web:db91c054fc56576e04880c",
};

// Evita reinicializar Firebase cada vez que se ejecute la función
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
