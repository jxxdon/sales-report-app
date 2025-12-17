import { db } from "./firebase.js";
import { collection, onSnapshot }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const selectSales = document.getElementById("selectSales");
const laporanContent = document.getElementById("laporanContent");
const salesNameEl = document.getElementById("salesName");
const periodeEl = document.getElementById("periode");

const sumBaru = document.getElementById("sumBaru");
const sumProgress = document.getElementById("sumProgress");
const sumSurvey = document.getElementById("sumSurvey");
const sumBooking = document.getElementById("sumBooking");

let prospek = [];

function percent(v,t){
  return t ? ((v/t)*100).toFixed(1)+"%" : "0%";
}

function row(label,value){
  return `<div class="row"><span>${label}</span><span>${value}</span></div>`;
}

function render(sales){
  const data = prospek.filter(p=>p.namaUser===sales);
  const total = data.length;

  salesNameEl.textContent = sales;
  periodeEl.textContent = "Bulan : Desember | Tahun : 2025";

  /* ================= SUMMARY ================= */
  sumBaru.textContent = total;

  const progress = {
    Cold:0, Warm:0, Hot:0,
    Negosiasi:0, Survey:0,
    Booking:0, Lost:0
  };

  data.forEach(p=>{
    if(progress[p.status] !== undefined){
      progress[p.status]++;
    }
  });

  sumSurvey.textContent = progress.Survey;
  sumBooking.textContent = progress.Booking;
  sumProgress.textContent =
    progress.Cold + progress.Warm + progress.Hot + progress.Negosiasi;

  let html = `
    <div class="section">
      <strong>Input Prospek Baru :</strong> ${total} Orang
    </div>
  `;

  /* ================= ASAL PROSPEK ================= */
  const asal = {};
  data.forEach(p=>{
    asal[p.asalProspek] = (asal[p.asalProspek]||0)+1;
  });

  html+=`<div class="section"><h3>Asal Prospek</h3>
    ${row("Total", total+" prospek")}
  `;
  Object.keys(asal).forEach(a=>{
    html+=row(a,`${asal[a]} / ${percent(asal[a],total)}`);
  });
  html+=`</div>`;

  /* ================= ASAL KOTA ================= */
  const kota = {};
  data.forEach(p=>{
    kota[p.asalKota] = (kota[p.asalKota]||0)+1;
  });

  html+=`<div class="section"><h3>Asal Kota</h3>
    ${row("Total", total+" prospek")}
  `;
  Object.keys(kota).forEach(k=>{
    html+=row(k,`${kota[k]} / ${percent(kota[k],total)}`);
  });
  html+=`</div>`;

  /* ================= KETERTARIKAN ================= */
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

  /* ================= PROGRESS PROSPEK (BAWAH) ================= */
  html+=`<div class="section">
    <h3>Progress Prospek</h3>
    ${Object.keys(progress)
      .map(k=>row(k, progress[k]+" orang"))
      .join("")}
  </div>`;

  laporanContent.innerHTML = html;
}

/* ================= LOAD DATA ================= */
onSnapshot(collection(db,"prospek"), snap=>{
  prospek = snap.docs.map(d=>d.data());

  const salesList = [...new Set(
    prospek.map(p=>p.namaUser).filter(Boolean)
  )];

  selectSales.innerHTML =
    salesList.map(s=>`<option>${s}</option>`).join("");

  if(salesList.length){
    render(salesList[0]);
  }
});

selectSales.onchange = e => render(e.target.value);
