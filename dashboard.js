import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ================== AUTH ==================
const user = localStorage.getItem("user");
if (!user) window.location.href = "index.html";

const namaUser = localStorage.getItem("namaUser") || user;

// ================== SIMPAN PROSPEK ==================
document.getElementById("btnSimpan").addEventListener("click", async () => {
  const noTelp = document.getElementById("noTelp").value.trim();
  const nama = document.getElementById("nama").value.trim();
  const asalKota = document.getElementById("asalKota").value;
  const asalProspek = document.getElementById("asalProspek").value;
  const catatan = document.getElementById("catatan").value.trim();

  const produkChecked = Array.from(
    document.querySelectorAll('#produkGroup input[type="checkbox"]:checked')
  ).map(cb => cb.value);

  // ===== VALIDASI =====
  if (!noTelp || !nama || !asalKota) {
    alert("No Telepon, Nama, dan Asal Kota wajib diisi!");
    return;
  }

  if (!asalProspek) {
    alert("Asal Prospek wajib dipilih!");
    return;
  }

  if (produkChecked.length === 0) {
    alert("Minimal pilih 1 produk yang diminati!");
    return;
  }

  if (!catatan) {
    alert("Catatan Prospek wajib diisi!");
    return;
  }

  const btn = document.getElementById("btnSimpan");
  btn.disabled = true;
  btn.textContent = "Menyimpan...";

  try {
    await addDoc(collection(db, "prospek"), {
      userId: user,
      namaUser,
      noTelp,
      nama,
      asalKota,
      asalProspek,
      tipeTertarik: produkChecked,
      catatan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    alert("Prospek berhasil disimpan ✅");
    location.reload();

  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan prospek ❌");
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 Simpan Prospek";
  }
});
