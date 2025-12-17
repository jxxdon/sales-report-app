import { db } from "./firebase.js";
import { collection, onSnapshot }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
   KONFIG RESMI
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

// ===== ATURAN FINAL =====
const MIN_DATABASE    = 150;
const MAX_SURVEY_RATE = 0.10;   // 10% database
const MAX_BOOKING     = 1;
const TARGET_FOLLOWUP = 10;

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
function render(sales){
  const tahun = Number(filterTahun.value);
  const bulan = filterBulan.value;

  salesNameEl.textContent = sales;
  periodeEl.textContent =
    bulan==="all" ? `Tahun : ${tahun}` : `Bulan : ${BULAN[bulan]} | Tahun : ${tahun}`;

  const dataSales = prospek.filter(p=>p.namaUser===sales);
  const totalDatabase = dataSales.length;

  const dataPeriode = dataSales.filter(p=>{
    return (p.comments||[]).some(c=>{
      if(!c.createdAt) return false;
      const d = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      if(d.getFullYear()!==tahun) return false;
      if(bulan!=="all" && d.getMonth()!==Number(bulan)) return false;
      return true;
    });
  });
const totalDatabasePeriode = dataSales.filter(p=>{
  if (!p.createdAt) return false;
  const d = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
  if (d.getFullYear() !== tahun) return false;
  if (bulan !== "all" && d.getMonth() !== Number(bulan)) return false;
  return true;
}).length;


  const histori = {};
  PROGRESS_LIST.forEach(p=>histori[p]=0);

  dataPeriode.forEach(p=>{
    (p.comments||[]).forEach(c=>{
      if(!c.createdAt) return;
      const d = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      if(d.getFullYear()!==tahun) return;
      if(bulan!=="all" && d.getMonth()!==Number(bulan)) return;
      if(histori[c.progress]!==undefined) histori[c.progress]++;
    });
  });

  const prospekAktif = dataPeriode.length;
  const totalAktivitas = Object.values(histori).reduce((a,b)=>a+b,0);
  const hari = bulan==="all" ? 365 : new Date(tahun,Number(bulan)+1,0).getDate();
  const aktivitasPerHari = totalAktivitas / hari;

  /* highlight tetap */
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

/* =====================
   ASAL PROSPEK
===================== */
const asal = {};
dataPeriode.forEach(p=>{
  asal[p.asalProspek] = (asal[p.asalProspek]||0)+1;
});

html += `<div class="section"><h3>Asal Prospek</h3>
${row("Total", prospekAktif+" prospek")}`;
Object.keys(asal).forEach(a=>{
  html += row(a, `${asal[a]} / ${percent(asal[a], prospekAktif)}`);
});
html += `</div>`;

/* =====================
   ASAL KOTA
===================== */
const kota = {};
dataPeriode.forEach(p=>{
  kota[p.asalKota] = (kota[p.asalKota]||0)+1;
});

html += `<div class="section"><h3>Asal Kota</h3>
${row("Total", prospekAktif+" prospek")}`;
Object.keys(kota).forEach(k=>{
  html += row(k, `${kota[k]} / ${percent(kota[k], prospekAktif)}`);
});
html += `</div>`;

/* =====================
   KETERTARIKAN
===================== */
const minat = {};
dataPeriode.forEach(p=>{
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

/* =====================
   PROGRESS HISTORI
===================== */
html += `<div class="section"><h3>Progress Prospek</h3>`;
PROGRESS_LIST.forEach(p=>{
  html += row(p, histori[p] + " aktivitas");
});
html += `</div>`;

  /* =====================
     BALANCED SCORE (RUMUS BARU)
  ===================== */
  const penaltyDatabase = Math.min(totalDatabase / MIN_DATABASE, 1);

  // PROSES (kena penalty)
  const prospekAktifRate = rateRaw(prospekAktif, totalDatabase);
  const surveyRate      = Math.min(rateRaw(histori.Survey, MAX_SURVEY_RATE*totalDatabase),1);
  const followUpRate    = Math.min(rateRaw(aktivitasPerHari, TARGET_FOLLOWUP),1);

  const skorProses =
    (prospekAktifRate * 20) +
    (surveyRate        * 25) +
    (followUpRate      * 25);

  // HASIL (TIDAK kena penalty)
  const bookingRate = Math.min(rateRaw(histori.Booking, MAX_BOOKING),1);
  const skorBooking = bookingRate * 30;

  const skorAkhir = (skorProses * penaltyDatabase) + skorBooking;

  html += `
  <div class="section" style="border:2px solid #2563eb;border-radius:18px;padding:18px;margin-top:30px">
    <h3 style="text-align:center">Penilaian Kinerja Sales</h3>
    ${row("Prospek Aktif Rate", rateDisplay(prospekAktif, totalDatabase))}
    ${row("Survey Rate", rateDisplay(histori.Survey, MAX_SURVEY_RATE*totalDatabase))}
    ${row("Booking Rate", rateDisplay(histori.Booking, MAX_BOOKING))}
    ${row("Follow Up Rate", rateDisplay(aktivitasPerHari, TARGET_FOLLOWUP))}
    <hr>
    ${row("<strong>Skor Akhir</strong>", `<strong>${skorAkhir.toFixed(1)}</strong>`)}
  </div>`;
/* =====================
   CATATAN PENCAPAIAN SALES
===================== */
let catatan = "";

if (skorAkhir < 5) {
  catatan = "Database sangat kecil, sangat tidak layak. Sales perlu dievaluasi!";
} else if (skorAkhir < 15) {
  catatan = "Database ada peningkatan, Sales perlu dievaluasi!";
} else if (skorAkhir < 30) {
  catatan = "Database mulai sehat, Sales mulai aktif";
} else if (skorAkhir < 50) {
  catatan = "Database sehat, Performa sales meningkat";
} else if (skorAkhir < 70) {
  catatan = "Performa Sales cukup baik";
} else {
  catatan = "Performance sales sangat memuaskan";
}

html += `
<div style="
  margin-top:20px;
  padding:12px;
  font-size:14px;
  border-top:1px dashed #999;
  color:#333;
">
  <strong>Catatan :</strong><br>
  ${catatan}
</div>
`;

  laporanContent.innerHTML = html;
}

/* =====================
   LOAD DATA
===================== */
onSnapshot(collection(db,"prospek"), snap=>{
  prospek = snap.docs.map(d=>d.data());
  const salesList = [...new Set(prospek.map(p=>p.namaUser).filter(Boolean))];
  selectSales.innerHTML = salesList.map(s=>`<option>${s}</option>`).join("");
  if(salesList.length){ initPeriode(); render(salesList[0]); }
});

selectSales.onchange = e => render(e.target.value);
