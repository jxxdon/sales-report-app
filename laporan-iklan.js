/* =========================================================
   RESUME IKLAN – FINAL
   - DANA  : dari laporan_iklan (berdasarkan PERIODE IKLAN)
   - LEAD  : dari aktivitas (INPUT_PROSPEK, berdasarkan TANGGAL KEJADIAN)
========================================================= */

import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const contentEl   = document.getElementById("content");
const filterTahun = document.getElementById("filterTahun");
const filterBulan = document.getElementById("filterBulan");

const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];

let laporanIklan = [];
let aktivitas    = [];

/* ================= INIT FILTER ================= */
(function initFilter(){
  const now = new Date();
  const y = now.getFullYear();

  filterTahun.innerHTML =
    Array.from({ length: 6 }, (_, i) =>
      `<option value="${y - i}">${y - i}</option>`
    ).join("");

  filterBulan.innerHTML =
    `<option value="all">Tahunan</option>` +
    BULAN.map((b, i) => `<option value="${i}">${b}</option>`).join("");

  filterTahun.value = y;
  filterBulan.value = "all";
})();

/* ================= LOAD DATA ================= */
onSnapshot(collection(db, "laporan_iklan"), snap => {
  laporanIklan = snap.docs.map(d => d.data());
  render();
});

onSnapshot(collection(db, "aktivitas"), snap => {
  aktivitas = snap.docs.map(d => d.data());
  render();
});

/* ================= HELPER ================= */
function hitungIrisanHari(start, end, rangeStart, rangeEnd) {
  const s = start > rangeStart ? start : rangeStart;
  const e = end   < rangeEnd   ? end   : rangeEnd;
  if (s > e) return 0;
  return Math.floor((e - s) / 86400000) + 1;
}

/* ================= RENDER ================= */
function render() {
  if (!laporanIklan.length && !aktivitas.length) {
    contentEl.innerHTML = "<p>Tidak ada data</p>";
    return;
  }

  const tahun = Number(filterTahun.value);
  const bulan = filterBulan.value;

  const rangeStart =
    bulan === "all"
      ? new Date(tahun, 0, 1)
      : new Date(tahun, Number(bulan), 1);

  const rangeEnd =
    bulan === "all"
      ? new Date(tahun, 11, 31, 23, 59, 59)
      : new Date(tahun, Number(bulan) + 1, 0, 23, 59, 59);

  /* =====================================================
     1) HITUNG DANA (DARI LAPORAN IKLAN – PERIODE IKLAN)
  ===================================================== */
  let totalDana = 0;
  const danaBySales = {};
  const danaByTipe  = {};

  laporanIklan.forEach(x => {
    if (!x.startDate || !x.endDate) return;

    const start = x.startDate.toDate ? x.startDate.toDate() : new Date(x.startDate);
    const end   = x.endDate.toDate   ? x.endDate.toDate()   : new Date(x.endDate);

    const totalHari =
      Math.floor((end - start) / 86400000) + 1;

    const hariTerpakai =
      hitungIrisanHari(start, end, rangeStart, rangeEnd);

    if (!hariTerpakai || !totalHari) return;

    const danaTotal = Number(x.danaDihabiskan ?? x.anggaran ?? 0);
    if (!danaTotal) return;

    const danaPakai = (hariTerpakai === totalHari)
      ? danaTotal
      : danaTotal * (hariTerpakai / totalHari);

    totalDana += danaPakai;

    const sales = x.sales || "ALL";
    const tipe  = x.tipeIklan || "-";

    danaBySales[sales] ??= 0;
    danaBySales[sales] += danaPakai;

    danaByTipe[tipe] ??= 0;
    danaByTipe[tipe] += danaPakai;
  });

  /* =====================================================
     2) HITUNG LEAD (DARI AKTIVITAS – TANGGAL KEJADIAN)
  ===================================================== */
  let totalLead = 0;
  const leadBySales = {};
  const leadByTipe  = {};

  aktivitas
    .filter(a => a.tipe === "INPUT_PROSPEK")
    .forEach(a => {
      const tgl = a.createdAt?.toDate
        ? a.createdAt.toDate()
        : new Date(a.createdAt);

      if (!tgl) return;
      if (tgl < rangeStart || tgl > rangeEnd) return;

      totalLead++;

      const sales = a.user || "ALL";
      const tipeList = (a.produk || "")
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);

      leadBySales[sales] ??= 0;
      leadBySales[sales]++;

      if (!tipeList.length) {
        leadByTipe["Umum"] ??= 0;
        leadByTipe["Umum"]++;
      } else {
        tipeList.forEach(t => {
          leadByTipe[t] ??= 0;
          leadByTipe[t]++;
        });
      }
    });

  /* =====================================================
     3) OUTPUT
  ===================================================== */
  contentEl.innerHTML = `
    <div class="box">
      <h3>Ringkasan Total</h3>
      <div class="row"><b>Total Dana</b><span>Rp ${Math.round(totalDana).toLocaleString("id-ID")}</span></div>
      <div class="row"><b>Total Lead</b><span>${totalLead}</span></div>
    </div>

    <div class="box">
      <h3>Per Sales</h3>
      ${Object.keys({...danaBySales, ...leadBySales}).map(s => `
        <div class="row">
          <span>${s}</span>
          <span>
            ${leadBySales[s] || 0} lead |
            Rp ${Math.round(danaBySales[s] || 0).toLocaleString("id-ID")}
          </span>
        </div>
      `).join("")}
    </div>

    <div class="box">
      <h3>Per Tipe</h3>
      ${Object.keys({...danaByTipe, ...leadByTipe}).map(t => `
        <div class="row">
          <span>${t}</span>
          <span>
            ${leadByTipe[t] || 0} lead |
            Rp ${Math.round(danaByTipe[t] || 0).toLocaleString("id-ID")}
          </span>
        </div>
      `).join("")}
    </div>
  `;
}
