import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const user = localStorage.getItem("user");

if (!user) {
  window.location.href = "index.html";
}

document.getElementById("btnSimpan").addEventListener("click", async () => {
  const produk = document.getElementById("produk").value;
  const qty = document.getElementById("qty").value;
  const omzet = document.getElementById("omzet").value;

  if (!produk || !qty || !omzet) {
    alert("Lengkapi semua data");
    return;
  }

  try {
    await addDoc(collection(db, "salesReports"), {
      user: user,
      produk: produk,
      qty: Number(qty),
      omzet: Number(omzet),
      createdAt: serverTimestamp()
    });

    alert("Laporan berhasil disimpan ✅");

    document.getElementById("produk").value = "";
    document.getElementById("qty").value = "";
    document.getElementById("omzet").value = "";

  } catch (error) {
    alert("Gagal simpan data ❌");
    console.error(error);
  }
});
