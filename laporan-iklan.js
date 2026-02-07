import { db } from "./firebase.js";
import {
  collection,
  getDocs,
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

if (!btn) {
  console.log("Bukan halaman input laporan iklan");
  throw new Error("Form tidak ditemukan");
}

/* =====================================================
   SALES — DARI DASHBOARD (AUTH)
   SELARAS DENGAN aktivitas.user & prospek.user
===================================================== */
async function loadSales() {
  const snap = await getDocs(collection(db, "aktivitas"));
  const salesSet = new Set();

  snap.forEach(docSnap => {
    const d = docSnap.data();
    if (d.user) salesSet.add(d.user);
  });

  salesEl.innerHTML = "";

  // ALL selalu ada, admin & sales sama
  salesEl.insertAdjacentHTML(
    "beforeend",
    `<option value="ALL">ALL</option>`
  );

  Array.from(salesSet)
    .sort()
    .forEach(s => {
      salesEl.insertAdjacentHTML(
        "beforeend",
        `<option value="${s}">${s}</option>`
      );
    });
}

loadSales();


/* =====================================================
   TIPE IKLAN — DARI DATA NYATA PROSPEK
   sumber: prospek.tipeTertarik (ARRAY)
===================================================== */
async function loadTipeIklan() {
  const snap = await getDocs(collection(db, "prospek"));
  const tipeSet = new Set();

  snap.forEach(docSnap => {
    const d = docSnap.data();
    (d.tipeTertarik || []).forEach(t => {
      if (t) tipeSet.add(t);
    });
  });

  tipeEl.innerHTML = "";

  Array.from(tipeSet)
    .sort()
    .forEach(t => {
      tipeEl.insertAdjacentHTML(
        "beforeend",
        `<option value="${t}">${t}</option>`
      );
    });
}

loadTipeIklan();

/* =====================================================
   SUBMIT LAPORAN IKLAN
   SIMPAN KE collection: laporan_iklan
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
