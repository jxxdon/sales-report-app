import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ================== CEK LOGIN ==================
const user = localStorage.getItem("user");
if (!user) {
  window.location.href = "index.html";
}
const namaUser = localStorage.getItem("namaUser") || user;

// ================== HEADER + LOGOUT ==================
window.addEventListener("DOMContentLoaded", () => {
  const header = document.createElement("div");
  header.style = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 70px;
    background-color: #343a40;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    z-index: 1000;
  `;

  const welcome = document.createElement("div");
  welcome.innerHTML = `<strong>Selamat datang,</strong> ${namaUser}`;

  const logoutButton = document.createElement("button");
  logoutButton.textContent = "Logout";
  logoutButton.style = `
    padding: 10px 20px;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  `;
  logoutButton.onclick = () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      localStorage.clear();
      window.location.href = "index.html";
    }
  };

  header.appendChild(welcome);
  header.appendChild(logoutButton);
  document.body.insertBefore(header, document.body.firstChild);
  document.body.style.paddingTop = "80px";
});

// ================== SIMPAN PROSPEK ==================
document.getElementById("btnSimpan").addEventListener("click", async () => {
  const noTelp = document.getElementById("noTelp").value.trim();
  const nama = document.getElementById("nama").value.trim();
  const asalKota = document.getElementById("asalKota").value;
  const asalProspek = document.getElementById("asalProspek").value;
  const catatan = document.getElementById("catatan").value.trim();

  const tipeTertarik = Array.from(
    document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked')
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
  if (tipeTertarik.length === 0) {
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
      tipeTertarik,
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
