import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =================================================
   KONFIG TARGET (SAMA DENGAN LAPORAN SALES)
================================================= */
const TARGET_INPUT_HARIAN   = 5;
const TARGET_KOMENTAR_HARI = 10;
const TARGET_PROSPEK_AKTIF = 150;
const TARGET_SURVEY_BULAN  = 15;
const TARGET_BOOKING_BULAN = 2;

/* =================================================
   ELEMENT
================================================= */
const gridEl  = document.getElementById("resumeGrid");
const bulanEl = document.getElementById("bulan"); // <select> TANPA value angka
const tahunEl = document.getElementById("tahun");

/* =================================================
   STATE
================================================= */
let prospek = [];

/* =================================================
   HELPER
================================================= */
function toDate(ts){
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}

/* =================================================
   CORE LOGIC — IDENTIK LAPORAN SALES
================================================= */
function hitungResumeSales(sales, bulan, tahun, prospek){

  /* ===== DATABASE PERIODE ===== */
  const databasePeriode = prospek.filter(p=>{
    if (p.namaUser !== sales) return false;
    if (!p.createdAt) return false;

    const d = toDate(p.createdAt);
    return d.getFullYear() === tahun && d.getMonth() === bulan;
  });

  const totalDatabasePeriode = databasePeriode.length;

  /* ===== AKTIVITAS PERIODE ===== */
  const aktivitas = [];

  prospek.forEach(p=>{
    (p.comments || []).forEach(c=>{
      if (c.user !== sales) return;
      if (!c.createdAt) return;

      const d = toDate(c.createdAt);
      if (d.getFullYear() !== tahun) return;
      if (d.getMonth() !== bulan) return;

      aktivitas.push({
        progress: c.progress,
        prospekId: p.noTelp
      });
    });
  });

  const totalAktivitas = aktivitas.length;

  /* ===== PROSPEK AKTIF ===== */
  const prospekAktif = new Set(
    aktivitas.map(a => a.prospekId)
  ).size;

  /* ===== SURVEY & BOOKING ===== */
  const survey  = aktivitas.filter(a=>a.progress === "Survey").length;
  const booking = aktivitas.filter(a=>a.progress === "Booking").length;

  /* ===== RATE ===== */
  const hari = new Date(tahun, bulan + 1, 0).getDate();

  const inputPerHari    = totalDatabasePeriode / hari;
  const komentarPerHari = totalAktivitas / hari;

  const inputRate =
    Math.min(inputPerHari / TARGET_INPUT_HARIAN, 1);

  const komentarRate =
    Math.min(komentarPerHari / TARGET_KOMENTAR_HARI, 1);

  const prospekAktifRate =
    Math.min(prospekAktif / TARGET_PROSPEK_AKTIF, 1);

  const surveyRate =
    Math.min(survey / TARGET_SURVEY_BULAN, 1);

  const bookingRate =
    Math.min(booking / TARGET_BOOKING_BULAN, 1);

  /* ===== SKOR AKHIR (100 POINT) ===== */
  const point =
    (inputRate        * 15) +
    (komentarRate     * 15) +
    (prospekAktifRate * 15) +
    (surveyRate       * 15) +
    (bookingRate      * 40);

  return {
  prospekBaru   : totalDatabasePeriode,
  prospekAktif,
  followUp     : totalAktivitas, // ⬅️ INI TAMBAHAN
  survey,
  booking,
  point: Number(point.toFixed(1))
};

}

/* =================================================
   RENDER UI
================================================= */
function render(){

  // 🔑 INI KUNCI SUPAYA TIDAK NaN
  const bulan = bulanEl.selectedIndex; // 0–11
  const tahun = Number(tahunEl.value);

  if (isNaN(bulan) || isNaN(tahun)) return;

  gridEl.innerHTML = "";

  const salesList = [
    ...new Set(
      prospek
        .map(p => p.namaUser)
        .filter(s => s && s.toLowerCase() !== "admin")
    )
  ];

  if (!salesList.length) {
    gridEl.innerHTML = `<div style="opacity:.6">Belum ada data sales</div>`;
    return;
  }

  salesList.sort().forEach(sales => {

    const data = hitungResumeSales(
      sales,
      bulan,
      tahun,
      prospek
    );

    gridEl.innerHTML += `
      <div class="card">
        <div class="name">${sales}</div>
        <div class="point">Point : ${data.point}</div>

        <div class="line">${data.prospekBaru} Prospek Baru</div>
        <div class="line">${data.prospekAktif} Prospek Aktif</div>
        <div class="line">${data.followUp}x Follow Up</div>
        <div class="line">${data.survey}x Survey</div>
        <div class="line">${data.booking} Booking</div>
      </div>
    `;
  });
}

/* =================================================
   EVENT
================================================= */
bulanEl.onchange = render;
tahunEl.onchange = render;

/* =================================================
   FIRESTORE LISTENER
================================================= */
onSnapshot(collection(db, "prospek"), snap=>{
  prospek = snap.docs.map(d => d.data());
  render();
});
