import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Cek apakah user sudah login
const user = localStorage.getItem("user");
if (!user) {
  window.location.href = "index.html";
}

const namaUser = localStorage.getItem("namaUser") || user;

// ==================== HEADER DENGAN LOGOUT ====================
window.addEventListener("DOMContentLoaded", () => {
  // Buat elemen header
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
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;

  // Teks selamat datang
  const welcome = document.createElement("div");
  welcome.innerHTML = `<strong>Selamat datang,</strong> ${namaUser}`;
  welcome.style.fontSize = "18px";

  // Tombol Logout
  const logoutButton = document.createElement("button");
  logoutButton.textContent = "Logout";
  logoutButton.style = `
    padding: 10px 20px;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
  `;
  logoutButton.onclick = () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("namaUser");
      window.location.href = "index.html";
    }
  };

  // Masukkan elemen ke header
  header.appendChild(welcome);
  header.appendChild(logoutButton);

  // Tambahkan header ke body (paling atas)
  document.body.insertBefore(header, document.body.firstChild);

  // Beri padding-top pada body agar konten tidak tertutup header
  document.body.style.paddingTop = "80px";
});

// =================================================================

// Kode simpan prospek (tetap sama seperti sebelumnya)
document.getElementById("btnSimpan").addEventListener("click", async () => {
  const noTelp = document.getElementById("noTelp").value.trim();
  const nama = document.getElementById("nama").value.trim();
  const asalKota = document.getElementById("asalKota").value;
  const asalProspek = document.getElementById("asalProspek").value;
  const tanggalSurvey = document.getElementById("tanggalSurvey").value || null;
  const catatan = document.getElementById("catatan").value.trim();
  const statusPenjualan = document.getElementById("statusPenjualan").value.trim();

  const tipeCheckboxes = document.querySelectorAll('input[type="checkbox"][value^="Volands"], input[type="checkbox"][value^="Carina"], input[type="checkbox"][value^="Nashira"], input[type="checkbox"][value^="Dorado"], input[type="checkbox"][value^="Lyra"], input[type="checkbox"][value^="Myra"], input[type="checkbox"][value^="Arion"], input[type="checkbox"][value^="Leonis"], input[type="checkbox"][value^="Vella"]');
  const tipeTertarik = Array.from(tipeCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  const progresCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
  const progresPenjualan = Array.from(progresCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  if (!noTelp || !nama || !asalKota) {
    alert("No Telepon, Nama, dan Asal Kota wajib diisi!");
    return;
  }

  const btnSimpan = document.getElementById("btnSimpan");
  btnSimpan.disabled = true;
  btnSimpan.textContent = "Menyimpan...";

  try {
    await addDoc(collection(db, "prospek"), {
      userId: user,
      namaUser: namaUser,
      noTelp: noTelp,
      nama: nama,
      asalKota: asalKota,
      asalProspek: asalProspek,
      tipeTertarik: tipeTertarik,
      tanggalSurvey: tanggalSurvey,
      catatan: catatan || null,
      statusPenjualan: statusPenjualan || "Prospect",
      progresPenjualan: progresPenjualan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    alert("Prospek berhasil disimpan! ✅");
    document.querySelector("form")?.reset();
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

  } catch (error) {
    console.error("Error menyimpan prospek:", error);
    alert("Gagal menyimpan prospek ❌\nCek console untuk detail error.");
  } finally {
    btnSimpan.disabled = false;
    btnSimpan.textContent = "Simpan Prospek";
  }
});
