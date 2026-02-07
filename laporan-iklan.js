import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ================= ELEMENT ================= */
const platformEl = document.getElementById("platform");
const tipeEl     = document.getElementById("tipeIklan");
const salesEl    = document.getElementById("salesSelect");
const startEl    = document.getElementById("startDate");
const endEl      = document.getElementById("endDate");
const anggaranEl = document.getElementById("anggaran");
const btn        = document.getElementById("btnHitung");

/* ================= GUARD ================= */
if (!btn) {
  console.log("Halaman ini bukan form laporan iklan");
}

/* ================= CONTOH DATA SELECT ================= */
// hapus bagian ini kalau datanya sudah diisi dari tempat lain
const TIPE_IKLAN = ["Kost", "Rumah", "Ruko", "Tanah"];
const SALES = ["ALL", "Andi", "Budi", "Citra"];

TIPE_IKLAN.forEach(t =>
  tipeEl.insertAdjacentHTML("beforeend", `<option value="${t}">${t}</option>`)
);

SALES.forEach(s =>
  salesEl.insertAdjacentHTML("beforeend", `<option value="${s}">${s}</option>`)
);

/* ================= SUBMIT ================= */
btn?.addEventListener("click", async () => {
  const platform  = platformEl.value;
  const tipeIklan = tipeEl.value;
  const sales     = salesEl.value;
  const startDate = startEl.value;
  const endDate   = endEl.value;
  const anggaran  = Number(anggaranEl.value || 0);

  if (!platform || !tipeIklan || !sales || !startDate || !endDate || !anggaran) {
    alert("Lengkapi semua data");
    return;
  }

  if (new Date(endDate) < new Date(startDate)) {
    alert("Tanggal akhir tidak boleh lebih kecil dari tanggal mulai");
    return;
  }

  try {
    await addDoc(collection(db, "laporan_iklan"), {
      platform,
      tipeIklan,
      sales,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      anggaran,
      createdAt: serverTimestamp()
    });

    alert("Laporan iklan berhasil disimpan");

    // reset
    startEl.value = "";
    endEl.value = "";
    anggaranEl.value = "";
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan laporan iklan");
  }
});
