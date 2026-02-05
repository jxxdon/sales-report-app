import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const elBulan = document.getElementById("filterBulan");
const elTahun = document.getElementById("filterTahun");
const hasil   = document.getElementById("hasil");

const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];

let laporanIklan = [];

/* ================= INIT FILTER ================= */
(function initFilter(){
  const now = new Date();
  const y = now.getFullYear();

  elBulan.innerHTML = BULAN
    .map((b,i)=>`<option value="${i}">${b}</option>`)
    .join("");

  elTahun.innerHTML =
    Array.from({length:6},(_,i)=>y-i)
      .map(v=>`<option value="${v}">${v}</option>`)
      .join("");

  elBulan.value = now.getMonth();
  elTahun.value = y;
})();

elBulan.onchange = render;
elTahun.onchange = render;

/* ================= LOAD DATA ================= */
onSnapshot(collection(db, "laporan_iklan"), snap => {
  laporanIklan = snap.docs.map(d => d.data());
  render();
});

/* ================= HELPER ================= */
function jumlahHari(a,b){
  return Math.floor((b-a)/86400000)+1;
}

function irisanHari(start,end,rs,re){
  const s = start>rs?start:rs;
  const e = end<re?end:re;
  if(s>e) return 0;
  return jumlahHari(s,e);
}

/* ================= RENDER ================= */
function render(){
  if(!laporanIklan.length){
    hasil.innerHTML = "<p>Data iklan belum ada</p>";
    return;
  }

  const bulan = Number(elBulan.value);
  const tahun = Number(elTahun.value);

  const rangeStart = new Date(tahun,bulan,1);
  const rangeEnd   = new Date(tahun,bulan+1,0,23,59,59);

  let total = 0;

  laporanIklan.forEach(x=>{
    if(!x.startDate || !x.endDate) return;

    const start = x.startDate.toDate();
    const end   = x.endDate.toDate();

    const totalHari = jumlahHari(start,end);
    const hariPakai = irisanHari(start,end,rangeStart,rangeEnd);
    if(!hariPakai) return;

    const anggaran = Number(x.anggaran||0);
    total += (hariPakai===totalHari)
      ? anggaran
      : anggaran*(hariPakai/totalHari);
  });

  const hariBulan = new Date(tahun,bulan+1,0).getDate();

  hasil.innerHTML = `
    <div class="box">
      <h3>Bulan Berjalan : ${BULAN[bulan]} ${tahun}</h3>
      <div class="row">
        <b>Total Anggaran Iklan</b>
        <span>Rp ${Math.round(total).toLocaleString("id-ID")},-</span>
      </div>
      <div class="row">
        <b>Rata-rata Anggaran per Hari</b>
        <span>Rp ${Math.round(total/hariBulan).toLocaleString("id-ID")},-</span>
      </div>
    </div>
  `;
}
