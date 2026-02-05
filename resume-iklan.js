import { laporanIklan } from "./laporan-iklan.js";

const elBulan = document.getElementById("filterBulan");
const elTahun = document.getElementById("filterTahun");
const hasil   = document.getElementById("hasil");

const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];

/* ================= INIT FILTER ================= */
(function initFilter(){
  const now = new Date();
  const tahunSekarang = now.getFullYear();

  elBulan.innerHTML = BULAN
    .map((b,i)=>`<option value="${i}">${b}</option>`)
    .join("");

  elTahun.innerHTML =
    Array.from({length:6},(_,i)=>tahunSekarang-i)
      .map(y=>`<option value="${y}">${y}</option>`)
      .join("");

  elBulan.value = now.getMonth();
  elTahun.value = tahunSekarang;
})();

elBulan.onchange = render;
elTahun.onchange = render;

/* ================= HELPER ================= */
function jumlahHari(d1, d2){
  return Math.floor((d2 - d1) / 86400000) + 1;
}

function irisanHari(start, end, rangeStart, rangeEnd){
  const s = start > rangeStart ? start : rangeStart;
  const e = end   < rangeEnd   ? end   : rangeEnd;
  if (s > e) return 0;
  return jumlahHari(s, e);
}

/* ================= RENDER ================= */
function render(){
  const bulan = Number(elBulan.value);
  const tahun = Number(elTahun.value);

  const rangeStart = new Date(tahun, bulan, 1);
  const rangeEnd   = new Date(tahun, bulan + 1, 0, 23, 59, 59);

  let totalAnggaran = 0;

  laporanIklan.forEach(item => {
    if (!item.startDate || !item.endDate) return;

    const start = new Date(item.startDate);
    const end   = new Date(item.endDate);

    const totalHariIklan = jumlahHari(start, end);
    const hariPakai = irisanHari(start, end, rangeStart, rangeEnd);

    if (!hariPakai) return;

    const anggaran = Number(item.anggaran || 0);

    const nilai =
      hariPakai === totalHariIklan
        ? anggaran
        : anggaran * (hariPakai / totalHariIklan);

    totalAnggaran += nilai;
  });

  const hariDalamBulan = new Date(tahun, bulan + 1, 0).getDate();
  const rataPerHari = totalAnggaran / hariDalamBulan;

  hasil.innerHTML = `
    <div class="box">
      <h3>Bulan Berjalan : ${BULAN[bulan]} ${tahun}</h3>

      <div class="row">
        <b>Total Anggaran Iklan</b>
        <span>Rp ${Math.round(totalAnggaran).toLocaleString("id-ID")},-</span>
      </div>

      <div class="row">
        <b>Rata-rata Anggaran per Hari</b>
        <span>Rp ${Math.round(rataPerHari).toLocaleString("id-ID")},-</span>
      </div>
    </div>
  `;
}

render();
