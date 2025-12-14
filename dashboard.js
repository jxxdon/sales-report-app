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

// Tambahkan nama user atau identifier yang lebih jelas (opsional)
const namaUser = localStorage.getItem("namaUser") || user;

document.getElementById("btnSimpan").addEventListener("click", async () => {
  // Ambil nilai input
  const noTelp = document.getElementById("noTelp").value.trim();
  const nama = document.getElementById("nama").value.trim();
  const asalKota = document.getElementById("asalKota").value;
  const asalProspek = document.getElementById("asalProspek").value;
  const tanggalSurvey = document.getElementById("tanggalSurvey").value || null;
  const catatan = document.getElementById("catatan").value.trim();
  const statusPenjualan = document.getElementById("statusPenjualan").value.trim();

  // Checkbox tipe tertarik (Volands, Carina, dll)
  const tipeCheckboxes = document.querySelectorAll('input[type="checkbox"][value^="Volands"], input[type="checkbox"][value^="Carina"], input[type="checkbox"][value^="Nashira"], input[type="checkbox"][value^="Dorado"], input[type="checkbox"][value^="Lyra"], input[type="checkbox"][value^="Myra"], input[type="checkbox"][value^="Arion"], input[type="checkbox"][value^="Leonis"], input[type="checkbox"][value^="Vella"]');
  const tipeTertarik = Array.from(tipeCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  // Checkbox progres penjualan
  const progresCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
  const progresPenjualan = Array.from(progresCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  // Validasi wajib
  if (!noTelp || !nama || !asalKota) {
    alert("No Telepon, Nama, dan Asal Kota wajib diisi!");
    return;
  }

  // Disable tombol saat proses simpan
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
      asalProspek: asalProspek,           // ini yang baru kamu pakai
      tipeTertarik: tipeTertarik,
      tanggalSurvey: tanggalSurvey,
      catatan: catatan || null,
      statusPenjualan: statusPenjualan || "Prospect",
      progresPenjualan: progresPenjualan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    alert("Prospek berhasil disimpan! ✅");

    // Reset form
    document.querySelector("form")?.reset();
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

  } catch (error) {
    console.error("Error menyimpan prospek:", error);
    alert("Gagal menyimpan prospek ❌\nCek console untuk detail error.\nKemungkinan: Aturan Firestore belum izinkan write.");
  } finally {
    // Kembalikan tombol
    btnSimpan.disabled = false;
    btnSimpan.textContent = "Simpan Prospek";
  }
});



