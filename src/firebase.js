import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 👉 Sustituye estos valores por los de TU proyecto de Firebase.
// Los encuentras en: Configuración del proyecto > Tus apps > (icono web </>) 
const firebaseConfig = {
  apiKey: "AIzaSyC9m5mgRAOIVJ3JA3Rigc5AA8OVd8cVLFk",
  authDomain: "los-tragedias.firebaseapp.com",
  projectId: "los-tragedias",
  storageBucket: "los-tragedias.firebasestorage.app",
  messagingSenderId: "305582656861",
  appId: "1:305582656861:web:eb74c4df9dbcb411762cb4",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
