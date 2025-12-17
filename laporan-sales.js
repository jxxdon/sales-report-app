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

/* =====================
   HELPER
===================== */
function percent(v,t){
  return t ? ((v/t)*100).toFixed(1)+"%" : "0%";
}

function rate(v,t){
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
  const thisYear = now.getFullYear();

  filterTahun.innerHTML =
    Array.from({length:6},(_,i)=>{
      const y = thisYear - i;
      return `<option value="${y}">${y}</option>`;
    }).join("");

  filterBulan.innerHTML =
    `<option value="all">Tahunan</option>` +
    BULAN.map((b,i)=>`<option value="${i}">${b}</option>`).join("");

  filterTahun.value = thisYear;
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
    bulan === "all"
      ? `Tahun : ${tahun}`
      : `Bulan : ${BULAN[bulan]} | Tahun : ${tahun}`;

  /* =====================
     DATA SALES & DATABASE
  ===================== */
  const dataSales = prospek.filter(p => p.namaUser === sales);
  const totalDatabase = dataSales.length;

  /* =====================
     DATA PER PERIODE
  ===================== */
  const dataPeriode = dataSales.filter(p=>{
    return (p.comments || []).some(c=>{
      if (!c.createdAt) return false;
      const d = c.createdAt.toDate
        ? c.createdAt.toDate()
        : new Date(c.createdAt);

      if (d.getFullYear() !== tahun) return false;
      if (bulan !== "all" && d.getMonth() !== Number(bulan)) return false;
      return true;
    });
  });

  /* =====================
     HISTORI KOMENTAR
  ===================== */
  const histori = {};
  PROGRESS_LIST.forEach(p => histori[p] = 0);

  dataPeriode.forEach(p=>{
    (p.comments||[]).forEach(c=>{
      if (!c.createdAt) return;

      const d = c.createdAt.toDate
        ? c.createdAt.toDate()
        : new Date(c.createdAt);

      if (d.getFullYear() !== tahun) return;
      if (bulan !== "all" && d.getMonth() !== Number(bulan)) return;

      if (histori[c.progress] !== undefined) {
        histori[c.progress]++;
      }
    });
  });

  const prospekAktif   = dataPeriode.length;
  const totalAktivitas = Object.values(histori).reduce((a,b)=>a+b,0);

  /* =====================
     HARI BERJALAN
  ===================== */
  let hari = 1;
  if (bulan === "all") {
    hari = 365;
  } else {
    hari = new Date(
      tahun,
      Number(bulan) + 1,
      0
    ).getDate();
  }

  const followUp = (totalAktivitas / hari).toFixed(1);

  /* =====================
     HIGHLIGHT
  ===================== */
  sumBaru.textContent     = prospekAktif;
  sumSurvey.textContent   = histori.Survey;
  sumBooking.textContent  = histori.Booking;
  sumProgress.textContent = totalAktivitas;

  let html = `
  <div class="section">
    <strong>Prospek Aktif :</strong> ${prospekAktif} Orang
  </div>
`;

  /* =====================
     ASAL PROSPEK
  ===================== */
  const asal = {};
  dataPeriode.forEach(p=>{
    asal[p.asalProspek] = (asal[p.asalProspek]||0)+1;
  });

  html+=`<div class="section"><h3>Asal Prospek</h3>
    ${row("Total", prospekAktif+" prospek")}
  `;
  Object.keys(asal).forEach(a=>{
    html+=row(a,`${asal[a]} / ${percent(asal[a],prospekAktif)}`);
  });
  html+=`</div>`;

  /* =====================
     ASAL KOTA
  ===================== */
  const kota = {};
  dataPeriode.forEach(p=>{
    kota[p.asalKota] = (kota[p.asalKota]||0)+1;
  });

  html+=`<div class="section"><h3>Asal Kota</h3>
    ${row("Total", prospekAktif+" prospek")}
  `;
  Object.keys(kota).forEach(k=>{
    html+=row(k,`${kota[k]} / ${percent(kota[k],prospekAktif)}`);
  });
  html+=`</div>`;

  /* =====================
     KETERTARIKAN
  ===================== */
  const minat = {};
  dataPeriode.forEach(p=>{
    (p.tipeTertarik||[]).forEach(t=>{
      minat[t]=(minat[t]||0)+1;
    });
  });

  html+=`<div class="section"><h3>Ketertarikan Prospek</h3>
    ${row("Total", prospekAktif+" prospek")}
  `;
  Object.keys(minat).forEach(m=>{
    html+=row(m,`${minat[m]} / ${percent(minat[m],prospekAktif)}`);
  });
  html+=`</div>`;

  /* =====================
     PROGRESS
  ===================== */
  html+=`<div class="section">
    <h3>Progress Prospek (Histori Komentar)</h3>
    ${PROGRESS_LIST.map(p=>row(p, histori[p]+" aktivitas")).join("")}
  </div>`;

  /* =====================
     RATE & CONVERSION
  ===================== */
  html+=`
  <div class="section" style="
    border:2px solid #4CAF50;
    border-radius:18px;
    padding:18px;
    margin-top:30px;
  ">
    <h3 style="text-align:center;margin-bottom:12px">
      Rate & Conversion :
    </h3>

    <div style="text-align:center;font-size:15px;line-height:1.8">
      <div>
        Prospek Aktif Rate :
        ${prospekAktif}/${totalDatabase}
        = ${rate(prospekAktif, totalDatabase)}
      </div>

      <div>
        Booking Rate :
        ${histori.Booking}/${totalDatabase}
        = ${rate(histori.Booking, totalDatabase)}
      </div>

      <div>
        Survey Rate :
        ${histori.Survey}/${totalDatabase}
        = ${rate(histori.Survey, totalDatabase)}
      </div>

      <div>
        Follow up :
        ${followUp} x / hari
      </div>
    </div>
  </div>
`;

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
