// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWDaudDwnVeqSJ-b4vYbWBylQt0HqJ_eI",
  authDomain: "verduras-frutas.firebaseapp.com",
  projectId: "verduras-frutas",
  storageBucket: "verduras-frutas.appspot.com",
  messagingSenderId: "253939309797",
  appId: "1:253939309797:web:db91c054fc56576e04880c",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
