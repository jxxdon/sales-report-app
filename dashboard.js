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
  // Ambil nilai input
  const noTelp = document.getElementById("noTelp").value.trim();
  const nama = document.getElementById("nama").value.trim();
  const asalKota = document.getElementById("asalKota").value;
  const ketertarikan = document.getElementById("ketertarikan").value.trim();
  const tanggalSurvey = document.getElementById("tanggalSurvey").value;
  const catatan = document.getElementById("catatan").value.trim();
  const statusPenjualan = document.getElementById("statusPenjualan").value.trim();

  // Checkbox tipe tertarik
  const tipeCheckboxes = document.querySelectorAll('input[type=checkbox][value^="Volands"], input[type=checkbox][value^="Carina"], input[type=checkbox][value^="Nashira"], input[type=checkbox][value^="Dorado"], input[type=checkbox][value^="Lyra"], input[type=checkbox][value^="Myra"], input[type=checkbox][value^="Arion"], input[type=checkbox][value^="Leonis"], input[type=checkbox][value^="Vella"]');
  const tipeTertarik = Array.from(tipeCheckboxes).filter(cb => cb.checked).map(cb => cb.value);

  // Checkbox progres penjualan
  const progresCheckboxes = document.querySelectorAll('.checkbox-group input[type=checkbox]');
  const progresPenjualan = Array.from(progresCheckboxes).filter(cb => cb.checked).map(cb => cb.value);

  // Validasi minimal
  if (!noTelp || !nama || !asalKota) {
    alert("No Telepon, Nama, dan Asal Kota wajib diisi!");
    return;
  }

  try {
    await addDoc(collection(db, "prospek"), {
      user: user,
      noTelp: noTelp,
      nama: nama,
      asalKota: asalKota,
      ketertarikan: ketertarikan,
      tipeTertarik: tipeTertarik,
      tanggalSurvey: tanggalSurvey || null,
      catatan: catatan,
      statusPenjualan: statusPenjualan,
      progresPenjualan: progresPenjualan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    alert("Prospek berhasil disimpan! ✅");
    // Reset form
    document.querySelectorAll("input, textarea, select").forEach(el => {
      if (el.type === "checkbox") el.checked = false;
      else el.value = "";
    });

  } catch (error) {
    alert("Gagal menyimpan data ❌");
    console.error("Error:", error);
  }
});
