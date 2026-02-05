import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const contentEl  = document.getElementById("content");
const filterTahun = document.getElementById("filterTahun");
const filterBulan = document.getElementById("filterBulan");

const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];

let laporan = [];

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
  laporan = snap.docs.map(d => d.data());
  render();
});

filterTahun.onchange = render;
filterBulan.onchange = render;

/* ================= HELPER ================= */
function hitungIrisanHari(start, end, rangeStart, rangeEnd) {
  const s = start > rangeStart ? start : rangeStart;
  const e = end   < rangeEnd   ? end   : rangeEnd;
  if (s > e) return 0;
  return Math.floor((e - s) / 86400000) + 1;
}

/* ================= RENDER ================= */
function render() {
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

  const data = laporan.filter(x => {
    const start = x.startDate.toDate();
    const end   = x.endDate.toDate();
    return start <= rangeEnd && end >= rangeStart;
  });

  if (!data.length) {
    contentEl.innerHTML = "<p>Tidak ada data</p>";
    return;
  }

  /* ===== AKUMULATOR ===== */
  let totalDana = 0;
  let totalLead = 0;
  let totalWalkIn = 0;

  const bySales = {};
  const byTipe  = {};

  /* ===== HITUNG ===== */
  data.forEach(x => {
    const start = x.startDate.toDate();
    const end   = x.endDate.toDate();

    const totalHari =
      Math.floor((end - start) / 86400000) + 1;

    const hariTerpakai =
      hitungIrisanHari(start, end, rangeStart, rangeEnd);

    if (!hariTerpakai || !totalHari) return;

    const fullInside =
      start >= rangeStart && end <= rangeEnd;

    let danaPakai = 0;
    let leadPakai = 0;

    if (fullInside) {
      danaPakai = x.anggaran;
      leadPakai = x.jumlahLead;
    } else {
      const rasio = hariTerpakai / totalHari;
      danaPakai = x.anggaran * rasio;
      leadPakai = x.jumlahLead * rasio;
    }

    // ===== TOTAL =====
    totalDana += danaPakai;
    totalLead += leadPakai;

    if (x.tipeIklan === "Umum") {
      totalWalkIn += leadPakai;
    }

    // ===== PER SALES =====
    bySales[x.sales] ??= { dana: 0, lead: 0 };
    bySales[x.sales].dana += danaPakai;
    bySales[x.sales].lead += leadPakai;

    // ===== PER TIPE =====
    byTipe[x.tipeIklan] ??= { dana: 0, lead: 0 };
    byTipe[x.tipeIklan].dana += danaPakai;
    byTipe[x.tipeIklan].lead += leadPakai;
  });

  /* ===== PEMBULATAN ===== */
  totalLead = Math.round(totalLead);
  totalWalkIn = Math.round(totalWalkIn);

  Object.values(bySales).forEach(v => v.lead = Math.round(v.lead));
  Object.values(byTipe).forEach(v => v.lead = Math.round(v.lead));

  /* ===== OUTPUT ===== */
  contentEl.innerHTML = `
    <div class="box">
      <h3>Ringkasan Total</h3>
      <div class="row"><b>Total Dana</b><span>Rp ${totalDana.toLocaleString("id-ID")}</span></div>
      <div class="row"><b>Total Lead</b><span>${totalLead}</span></div>
      <div class="row"><b>Walk-in</b><span>${totalWalkIn}</span></div>
    </div>

    <div class="box">
      <h3>Per Sales</h3>
      ${Object.entries(bySales).map(([s,v])=>`
        <div class="row">
          <span>${s}</span>
          <span>${v.lead} lead | Rp ${v.dana.toLocaleString("id-ID")}</span>
        </div>
      `).join("")}
    </div>

    <div class="box">
      <h3>Per Tipe Iklan</h3>
      ${Object.entries(byTipe).map(([t,v])=>`
        <div class="row">
          <span>${t}</span>
          <span>${v.lead} lead | Rp ${v.dana.toLocaleString("id-ID")}</span>
        </div>
      `).join("")}
    </div>
  `;
}
