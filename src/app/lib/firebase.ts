import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
    apiKey: "AIzaSyBsoOJiRC4nXyUySTtX7OZEEaZUqf8faUc",
    authDomain: "todolist-4fc35.firebaseapp.com",
    projectId: "todolist-4fc35",
    storageBucket: "todolist-4fc35.firebasestorage.app",
    messagingSenderId: "82515788148",
    appId: "1:82515788148:web:612672cb7f6ea449072c21",
    measurementId: "G-SLF8V1YHKK"
  };

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
