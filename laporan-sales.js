import { db } from "./firebase.js";
import { collection, onSnapshot }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ===== CHART INSTANCE (ANTI DUPLIKAT) =====
let chartKonsistensi = null;
let chartBandingSales = null;

/* =====================
   ELEMENT
===================== */
const selectSales    = document.getElementById("selectSales");
const laporanContent = document.getElementById("laporanContent");
const salesNameEl    = document.getElementById("salesName");
const periodeEl      = document.getElementById("periode");

const sumBaru     = document.getElementById("sumBaru");
const sumProgress = document.getElementById("sumProgress");
const sumSurvey   = document.getElementById("sumSurvey");
const sumBooking  = document.getElementById("sumBooking");

const filterTahun = document.getElementById("filterTahun");
const filterBulan = document.getElementById("filterBulan");

let prospek = [];

/* =====================
   KONFIG
===================== */
const PROGRESS_LIST = [
  "Cold","Warm","Hot","Survey",
  "Negosiasi","Booking","DP",
  "Closing","Lost","Batal"
];

const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];
/* ===== RUMUS BARU (SISTEM KONSISTENSI 100 POINT) ===== */

// target harian
const TARGET_INPUT_HARIAN   = 5;   // input prospek / hari
const TARGET_KOMENTAR_HARI  = 10;  // komentar / hari

// target bulanan
const TARGET_PROSPEK_AKTIF  = 150; // per bulan
const TARGET_SURVEY_BULAN   = 15;  // per bulan
const TARGET_BOOKING_BULAN  = 2;   // per bulan


/* =====================
   HELPER
===================== */
function rateRaw(v,t){ return t ? (v/t) : 0; }
function rateDisplay(v,t){
  if (!t) return "0%";
  return Math.min((v/t)*100,100).toFixed(1)+"%";
}
function percent(v,t){
  return t ? ((v/t)*100).toFixed(1)+"%" : "0%";
}
function row(label,value){
  return `<div class="row"><span>${label}</span><span>${value}</span></div>`;
}

/* =====================
   INIT FILTER
===================== */
function initPeriode(){
  const now = new Date();
  const y = now.getFullYear();

  filterTahun.innerHTML =
    Array.from({length:6},(_,i)=>`<option>${y-i}</option>`).join("");

  filterBulan.innerHTML =
    `<option value="all">Tahunan</option>` +
    BULAN.map((b,i)=>`<option value="${i}">${b}</option>`).join("");

  filterTahun.value = y;
  filterBulan.value = now.getMonth();

  filterTahun.onchange = () => render(selectSales.value);
  filterBulan.onchange = () => render(selectSales.value);
}

/* =====================
   RENDER
===================== */
function hitungSkorHarian(sales, bulan, tahun, prospek) {
  const lastDay =
    bulan === "all"
      ? 31
      : new Date(tahun, Number(bulan) + 1, 0).getDate();

  const result = [];

  for (let day = 1; day <= lastDay; day++) {
    const dateStart = new Date(tahun, Number(bulan), day, 0, 0, 0);
    const dateEnd   = new Date(tahun, Number(bulan), day, 23, 59, 59);

    // ===== INPUT PROSPEK (HARI INI) =====
    const inputHariIni = prospek.filter(p => {
      if (p.namaUser !== sales) return false;
      if (!p.createdAt) return false;
      const d = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
      return d >= dateStart && d <= dateEnd;
    }).length;

    // ===== AKTIVITAS s/d HARI INI =====
    let totalKomentar = 0;
    let survey = 0;
    let booking = 0;
    const prospekAktifSet = new Set();

    prospek.forEach(p => {
      (p.comments || []).forEach(c => {
        if (c.user !== sales) return;
        if (!c.createdAt) return;

        const d = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
        if (d > dateEnd) return;

        totalKomentar++;
        prospekAktifSet.add(p.noTelp);

        if (c.progress === "Survey") survey++;
        if (c.progress === "Booking") booking++;
      });
    });

    const prospekAktif = prospekAktifSet.size;

    // ===== RATE =====
    const inputRate =
      Math.min((inputHariIni / TARGET_INPUT_HARIAN), 1);

    const komentarRate =
  Math.min((totalKomentar / day) / TARGET_KOMENTAR_HARI, 1);

    const prospekAktifRate =
      Math.min(prospekAktif / TARGET_PROSPEK_AKTIF, 1);

    const surveyRate =
      Math.min(survey / TARGET_SURVEY_BULAN, 1);

    const bookingRate =
      Math.min(booking / TARGET_BOOKING_BULAN, 1);

    // ===== SKOR =====
    const skor =
      (inputRate        * 15) +
      (komentarRate     * 15) +
      (prospekAktifRate * 15) +
      (surveyRate       * 15) +
      (bookingRate      * 40);

    result.push({
      day,
      score: Number(skor.toFixed(1))
    });
  }

  return result;
}


function render(sales){
  const tahun = Number(filterTahun.value);
  const bulan = filterBulan.value;

  salesNameEl.textContent = sales;
  periodeEl.textContent =
    bulan==="all" ? `Tahun : ${tahun}` : `Bulan : ${BULAN[bulan]} | Tahun : ${tahun}`;

  /* ===== DATABASE (OWNER) ===== */
  const totalDatabase = prospek.filter(p=>p.namaUser===sales).length;

  const totalDatabasePeriode = prospek.filter(p=>{
    if(p.namaUser !== sales) return false;
    if(!p.createdAt) return false;
    const d = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
    if(d.getFullYear() !== tahun) return false;
    if(bulan!=="all" && d.getMonth()!==Number(bulan)) return false;
    return true;
  }).length;

  /* ===== AKTIVITAS (PELaku) ===== */
  const aktivitasSales = [];
  prospek.forEach(p=>{
    (p.comments||[]).forEach(c=>{
      if(c.user !== sales) return;
      if(!c.createdAt) return;

      const d = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      if(d.getFullYear() !== tahun) return;
      if(bulan!=="all" && d.getMonth()!==Number(bulan)) return;

      aktivitasSales.push({
        progress: c.progress,
        prospekId: p.noTelp
      });
    });
  });

  const histori = {};
  PROGRESS_LIST.forEach(p=>histori[p]=0);
  aktivitasSales.forEach(a=>{
    if(histori[a.progress]!==undefined){
      histori[a.progress]++;
    }
  });

  const prospekAktif = new Set(
    aktivitasSales.map(a=>a.prospekId)
  ).size;

  const totalAktivitas = Object.values(histori).reduce((a,b)=>a+b,0);
  const hari = bulan==="all" ? 365 : new Date(tahun,Number(bulan)+1,0).getDate();
  const aktivitasPerHari = totalAktivitas / hari;
// ===== HARIAN =====
const inputPerHari    = totalDatabasePeriode / hari;
const komentarPerHari = totalAktivitas / hari;

// ===== RATE (0 - 1) =====
const inputRate =
  Math.min(inputPerHari / TARGET_INPUT_HARIAN, 1);

const komentarRate =
  Math.min(komentarPerHari / TARGET_KOMENTAR_HARI, 1);

const prospekAktifRate =
  Math.min(prospekAktif / TARGET_PROSPEK_AKTIF, 1);

const surveyRate =
  Math.min(histori.Survey / TARGET_SURVEY_BULAN, 1);

const bookingRate =
  Math.min(histori.Booking / TARGET_BOOKING_BULAN, 1);

  /* ===== HIGHLIGHT ===== */
  sumBaru.textContent     = prospekAktif;
  sumSurvey.textContent   = histori.Survey;
  sumBooking.textContent  = histori.Booking;
  sumProgress.textContent = totalAktivitas;

  const persenAktif = percent(prospekAktif, totalDatabasePeriode);

  let html = `
  <div class="section">
    <strong>Prospek Aktif :</strong>
    ${prospekAktif} orang dari ${totalDatabasePeriode} (${persenAktif})
  </div>`;

  /* ===== PROSPEK AKTIF LIST ===== */
  const prospekMap = {};
  aktivitasSales.forEach(a=>{
    const p = prospek.find(x=>x.noTelp===a.prospekId);
    if(p) prospekMap[p.noTelp] = p;
  });
  const prospekAktifList = Object.values(prospekMap);

  /* ===== ASAL PROSPEK ===== */
  const asal = {};
  prospekAktifList.forEach(p=>{
    asal[p.asalProspek] = (asal[p.asalProspek]||0)+1;
  });

  html += `<div class="section"><h3>Asal Prospek</h3>
  ${row("Total", prospekAktif+" prospek")}`;
  Object.keys(asal).forEach(a=>{
    html += row(a, `${asal[a]} / ${percent(asal[a], prospekAktif)}`);
  });
  html += `</div>`;

  /* ===== ASAL KOTA ===== */
  const kota = {};
  prospekAktifList.forEach(p=>{
    kota[p.asalKota] = (kota[p.asalKota]||0)+1;
  });

  html += `<div class="section"><h3>Asal Kota</h3>
  ${row("Total", prospekAktif+" prospek")}`;
  Object.keys(kota).forEach(k=>{
    html += row(k, `${kota[k]} / ${percent(kota[k], prospekAktif)}`);
  });
  html += `</div>`;

  /* ===== KETERTARIKAN ===== */
  const minat = {};
  prospekAktifList.forEach(p=>{
    (p.tipeTertarik||[]).forEach(t=>{
      minat[t] = (minat[t]||0)+1;
    });
  });

  html += `<div class="section"><h3>Ketertarikan Prospek</h3>
  ${row("Total", prospekAktif+" prospek")}`;
  Object.keys(minat).forEach(m=>{
    html += row(m, `${minat[m]} / ${percent(minat[m], prospekAktif)}`);
  });
  html += `</div>`;

  /* ===== PROGRESS ===== */
  html += `<div class="section"><h3>Progress Prospek</h3>`;
  PROGRESS_LIST.forEach(p=>{
    html += row(p, histori[p] + " aktivitas");
  });
  html += `</div>`;

  /* ===== SCORE ===== */
 // ===== SKOR AKHIR (TOTAL 100 POINT) =====
const skorAkhir =
  (inputRate        * 15) +
  (komentarRate     * 15) +
  (prospekAktifRate * 15) +
  (surveyRate       * 15) +
  (bookingRate      * 40);

  html += `
  <div class="section" style="border:2px solid #2563eb;border-radius:18px;padding:18px;margin-top:30px">
    <h3 style="text-align:center">Penilaian Kinerja Sales</h3>
   ${row("Input Harian",    (inputRate * 100).toFixed(1) + "%")}
${row("Komentar Harian", (komentarRate * 100).toFixed(1) + "%")}
${row("Prospek Aktif",   (prospekAktifRate * 100).toFixed(1) + "%")}
${row("Survey Bulanan",  (surveyRate * 100).toFixed(1) + "%")}
${row("Booking",         (bookingRate * 100).toFixed(1) + "%")}
    <hr>
    ${row("<strong>Skor Akhir</strong>", `<strong>${skorAkhir.toFixed(1)}</strong>`)}
  </div>`;

 laporanContent.innerHTML = html + `
  <div class="section"
       style="
         margin-top:40px;
         page-break-inside:avoid;
         break-inside:avoid;
       ">
    <h3>Grafik Konsistensi Harian</h3>
    <canvas id="chartKonsistensi" height="120"></canvas>

    <h3 style="margin-top:30px">Perbandingan Konsistensi Antar Sales</h3>
    <canvas id="chartBandingSales" height="140"></canvas>
  </div>
`;

// ===== RENDER GRAFIK KONSISTENSI =====
const canvas = document.getElementById("chartKonsistensi");
if (canvas && typeof Chart !== "undefined") {

  const dataHarian = hitungSkorHarian(
    sales,
    filterBulan.value,
    Number(filterTahun.value),
    prospek
  );

  const labels = dataHarian.map(d => d.day);
  const values = dataHarian.map(d => d.score);

  if (chartKonsistensi) {
    chartKonsistensi.destroy();
  }

  // ===== RENDER GRAFIK BANDING ANTAR SALES =====
const canvasBanding = document.getElementById("chartBandingSales");
if (canvasBanding && typeof Chart !== "undefined") {

  const datasets = [];
  const colors = [
    "#2563eb", "#16a34a", "#dc2626",
    "#7c3aed", "#ea580c", "#0891b2"
  ];

  const salesList = [...new Set(
  prospek
    .map(p => p.namaUser)
    .filter(s => s && s.toLowerCase() !== "admin")
)];


  salesList.forEach((s, i) => {
    const dataHarian = hitungSkorHarian(
      s,
      filterBulan.value,
      Number(filterTahun.value),
      prospek
    );

    datasets.push({
      label: s,
      data: dataHarian.map(d=>d.score),
      borderColor: colors[i % colors.length],
      tension: 0.3,
      fill: false,
      pointRadius: 0
    });
  });

  if (chartBandingSales) {
    chartBandingSales.destroy();
  }

  chartBandingSales = new Chart(canvasBanding, {
    type: "line",
    data: {
      labels: datasets[0]?.data.map((_,i)=>i+1),
      datasets
    },
    options: {
      responsive: true,
      scales: {
        y: { min: 0, max: 100 }
      }
    }
  });
}
}

}

/* =====================
   LOAD DATA
===================== */
onSnapshot(collection(db,"prospek"), snap=>{
  prospek = snap.docs.map(d=>d.data());
  const salesList = [...new Set(prospek.map(p=>p.namaUser).filter(Boolean))];
  selectSales.innerHTML = salesList.map(s=>`<option>${s}</option>`).join("");
 if (salesList.length) {
  initPeriode();
  render(selectSales.value || salesList[0]);
}

});

selectSales.onchange = e => render(e.target.value);
