import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
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
  console.log("Bukan halaman input laporan iklan");
}

/* =====================================================
   ISI SALES (DARI DASHBOARD / AUTH)
===================================================== */
const namaUser = localStorage.getItem("namaUser");
const role     = localStorage.getItem("role");

salesEl.innerHTML = "";

if (role === "admin") {
  salesEl.insertAdjacentHTML(
    "beforeend",
    `<option value="ALL">ALL</option>`
  );
}

if (namaUser) {
  salesEl.insertAdjacentHTML(
    "beforeend",
    `<option value="${namaUser}" selected>${namaUser}</option>`
  );
}

/* =====================================================
   ISI TIPE IKLAN (DARI FIRESTORE MASTER)
   collection: master_tipe_iklan
===================================================== */
async function loadTipeIklan() {
  try {
    const snap = await getDocs(collection(db, "master_tipe_iklan"));
    tipeEl.innerHTML = "";

    snap.forEach(doc => {
      const { nama } = doc.data();
      if (!nama) return;

      tipeEl.insertAdjacentHTML(
        "beforeend",
        `<option value="${nama}">${nama}</option>`
      );
    });
  } catch (err) {
    console.error(err);
    alert("Gagal memuat tipe iklan");
  }
}

loadTipeIklan();

/* =====================================================
   SUBMIT LAPORAN IKLAN
===================================================== */
btn.addEventListener("click", async () => {
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

  btn.disabled = true;
  btn.textContent = "Menyimpan...";

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

    startEl.value = "";
    endEl.value = "";
    anggaranEl.value = "";
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan laporan iklan");
  } finally {
    btn.disabled = false;
    btn.textContent = "Hitung & Simpan";
  }
});
