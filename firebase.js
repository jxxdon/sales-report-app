// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCahqfxFkL1HUyQWndLsw6fm_YD6vqj0hA",
  authDomain: "sales-report-35020.firebaseapp.com",
  projectId: "sales-report-35020",
  storageBucket: "sales-report-35020.firebasestorage.app",
  messagingSenderId: "284705080370",
  appId: "1:284705080370:web:98746b1f6d0d2cfa36a82b"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

// 🔹 export semuanya dari satu tempat
export { app, db, auth };
