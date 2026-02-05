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

/* ================= AMBIL TANGGAL LAPORAN (AMAN) ================= */
function ambilTanggalLaporan(x) {
  if (x.tanggalLaporan?.toDate) return x.tanggalLaporan.toDate();
  if (x.createdAt?.toDate) return x.createdAt.toDate();
  if (x.timestamp?.toDate) return x.timestamp.toDate();
  return null; // data lama
}

/* ================= RENDER ================= */
function render() {
  const tahun = Number(filterTahun.value);
  const bulan = filterBulan.value;

  const data = laporan.filter(x => {
    const tgl = ambilTanggalLaporan(x);
    if (!tgl) return true; // data lama tetap dihitung

    if (tgl.getFullYear() !== tahun) return false;
    if (bulan === "all") return true;
    return tgl.getMonth() === Number(bulan);
  });

  if (!data.length) {
    contentEl.innerHTML = "<p>Tidak ada data</p>";
    return;
  }

  let totalDana = 0;
  let totalLead = 0;
  let totalWalkIn = 0;

  const bySales = {};
  const byTipe  = {};

  data.forEach(x => {
    const dana = Number(x.danaDihabiskan || 0);
    const lead = Number(x.jumlahLead || 0);

    totalDana += dana;
    totalLead += lead;

    if (x.tipeIklan === "Umum") {
      totalWalkIn += lead;
    }

    // === PER SALES ===
    const sales = x.sales || "ALL";
    bySales[sales] ??= { dana: 0, lead: 0 };
    bySales[sales].dana += dana;
    bySales[sales].lead += lead;

    // === PER TIPE IKLAN ===
    const tipe = x.tipeIklan || "-";
    byTipe[tipe] ??= { dana: 0, lead: 0 };
    byTipe[tipe].dana += dana;
    byTipe[tipe].lead += lead;
  });

  /* ================= OUTPUT ================= */
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
