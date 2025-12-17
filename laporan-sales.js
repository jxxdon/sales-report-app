import { db } from "./firebase.js";
import { collection, onSnapshot }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================
   ELEMENT
===================== */
const selectSales   = document.getElementById("selectSales");
const laporanContent = document.getElementById("laporanContent");
const salesNameEl   = document.getElementById("salesName");
const periodeEl     = document.getElementById("periode");

const sumBaru     = document.getElementById("sumBaru");
const sumProgress = document.getElementById("sumProgress");
const sumSurvey   = document.getElementById("sumSurvey");
const sumBooking  = document.getElementById("sumBooking");

// OPTIONAL (aman walau belum ada di HTML)
const filterTahun = document.getElementById("filterTahun");
const filterBulan = document.getElementById("filterBulan");

let prospek = [];

/* =====================
   KONFIGURASI
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

/* =====================
   HELPER
===================== */
function percent(v,t){
  return t ? ((v/t)*100).toFixed(1)+"%" : "0%";
}

function row(label,value){
  return `<div class="row"><span>${label}</span><span>${value}</span></div>`;
}

/* =====================
   INIT FILTER PERIODE
===================== */
function initPeriode(){
  if (!filterTahun || !filterBulan) return;

  const now = new Date();
  const thisYear = now.getFullYear();

  filterTahun.innerHTML =
    Array.from({length:6},(_,i)=>{
      const y = thisYear - i;
      return `<option value="${y}">${y}</option>`;
    }).join("");

  filterBulan.innerHTML =
    BULAN.map((b,i)=>`<option value="${i}">${b}</option>`).join("");

  filterTahun.value = thisYear;
  filterBulan.value = now.getMonth();

  filterTahun.onchange = () => render(selectSales.value);
  filterBulan.onchange = () => render(selectSales.value);
}

/* =====================
   RENDER LAPORAN
===================== */
function render(sales){
  const data = prospek.filter(p => p.namaUser === sales);
  const total = data.length;

  salesNameEl.textContent = sales;

  const tahun = filterTahun ? Number(filterTahun.value) : null;
  const bulan = filterBulan ? Number(filterBulan.value) : null;

  if (filterTahun && filterBulan) {
    periodeEl.textContent =
      `Bulan : ${BULAN[bulan]} | Tahun : ${tahun}`;
  }

  /* =====================
     HISTORI KOMENTAR
  ===================== */
  const histori = {};
  PROGRESS_LIST.forEach(p => histori[p] = 0);

  data.forEach(p => {
    (p.comments || []).forEach(c => {
      if (!c.progress || !c.createdAt) return;

      const d = c.createdAt.toDate
        ? c.createdAt.toDate()
        : new Date(c.createdAt);

      if (tahun !== null && d.getFullYear() !== tahun) return;
      if (bulan !== null && d.getMonth() !== bulan) return;

      if (histori[c.progress] !== undefined) {
        histori[c.progress]++;
      }
    });
  });

  /* =====================
     HIGHLIGHT
  ===================== */
  sumBaru.textContent = total;
  sumSurvey.textContent = histori.Survey;
  sumBooking.textContent = histori.Booking;
  sumProgress.textContent =
    Object.values(histori).reduce((a,b)=>a+b,0);

  let html = `
    <div class="section">
      <strong>Input Prospek Baru :</strong> ${total} Orang
    </div>
  `;

  /* =====================
     ASAL PROSPEK
  ===================== */
  const asal = {};
  data.forEach(p=>{
    if (!p.asalProspek) return;
    asal[p.asalProspek] = (asal[p.asalProspek]||0)+1;
  });

  html+=`<div class="section"><h3>Asal Prospek</h3>
    ${row("Total", total+" prospek")}
  `;
  Object.keys(asal).forEach(a=>{
    html+=row(a,`${asal[a]} / ${percent(asal[a],total)}`);
  });
  html+=`</div>`;

  /* =====================
     ASAL KOTA
  ===================== */
  const kota = {};
  data.forEach(p=>{
    if (!p.asalKota) return;
    kota[p.asalKota] = (kota[p.asalKota]||0)+1;
  });

  html+=`<div class="section"><h3>Asal Kota</h3>
    ${row("Total", total+" prospek")}
  `;
  Object.keys(kota).forEach(k=>{
    html+=row(k,`${kota[k]} / ${percent(kota[k],total)}`);
  });
  html+=`</div>`;

  /* =====================
     KETERTARIKAN
  ===================== */
  const minat = {};
  data.forEach(p=>{
    (p.tipeTertarik||[]).forEach(t=>{
      minat[t]=(minat[t]||0)+1;
    });
  });

  html+=`<div class="section"><h3>Ketertarikan Prospek</h3>
    ${row("Total", total+" prospek")}
  `;
  Object.keys(minat).forEach(m=>{
    html+=row(m,`${minat[m]} / ${percent(minat[m],total)}`);
  });
  html+=`</div>`;

  /* =====================
     PROGRESS (HISTORI)
  ===================== */
  html+=`<div class="section">
    <h3>Progress Prospek (Histori Komentar)</h3>
    ${
      PROGRESS_LIST
        .map(p => row(p, histori[p] + " aktivitas"))
        .join("")
    }
  </div>`;

  laporanContent.innerHTML = html;
}

/* =====================
   LOAD DATA
===================== */
onSnapshot(collection(db,"prospek"), snap=>{
  prospek = snap.docs.map(d=>d.data());

  const salesList = [...new Set(
    prospek.map(p=>p.namaUser).filter(Boolean)
  )];

  selectSales.innerHTML =
    salesList.map(s=>`<option>${s}</option>`).join("");

  if (salesList.length) {
    initPeriode();
    render(selectSales.value || salesList[0]);
  }
});

selectSales.onchange = e => render(e.target.value);
