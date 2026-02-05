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

let danaByTipeUnit = {};
let danaBySales = {};

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
  danaByTipeUnit = {};
  danaBySales = {};

  
  laporanIklan.forEach(x=>{
    if(!x.startDate || !x.endDate) return;

    const start = x.startDate.toDate();
    const end   = x.endDate.toDate();

    const totalHari = jumlahHari(start,end);
    const hariPakai = irisanHari(start,end,rangeStart,rangeEnd);
    if(!hariPakai) return;

    const tipeUnit = x.tipeIklan || "Umum";
    const anggaran = Number(x.anggaran||0);
    const sales = x.sales || "Umum";

    danaBySales[sales] ??= 0;
    danaBySales[sales] +=
    (hariPakai === totalHari)
    ? anggaran
    : anggaran * (hariPakai / totalHari);

    danaByTipeUnit[tipeUnit] ??= 0;
    danaByTipeUnit[tipeUnit] +=
    (hariPakai === totalHari)
    ? anggaran
    : anggaran * (hariPakai / totalHari);
   
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
const listTipe = Object.entries(danaByTipeUnit)
  .sort((a,b)=>b[1]-a[1]);

hasil.innerHTML += `
  <div class="box">
    <h3>Total Distribusi Anggaran Iklan per Tipe Unit</h3>

    <table width="100%" cellpadding="6">
      <thead>
        <tr>
          <th align="left">Tipe Unit</th>
          <th align="right">Anggaran</th>
          <th align="right">%</th>
        </tr>
      </thead>
      <tbody>
        ${listTipe.map(([tipe, nilai])=>{
          const persen = total
            ? (nilai / total * 100)
            : 0;

          return `
            <tr>
              <td>${tipe}</td>
              <td align="right">
                Rp ${Math.round(nilai).toLocaleString("id-ID")},-
              </td>
              <td align="right">
                ${persen.toFixed(1)}%
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  </div>
`;

const listSales = Object.entries(danaBySales)
  .sort((a,b)=>b[1]-a[1]);

hasil.innerHTML += `
  <div class="box">
    <h3>Total Distribusi Anggaran Iklan per Sales</h3>

    <table width="100%" cellpadding="6">
      <thead>
        <tr>
          <th align="left">Sales</th>
          <th align="right">Anggaran</th>
          <th align="right">%</th>
        </tr>
      </thead>
      <tbody>
        ${listSales.map(([sales, nilai])=>{
          const persen = total ? (nilai/total*100) : 0;
          return `
            <tr>
              <td>${sales}</td>
              <td align="right">
                Rp ${Math.round(nilai).toLocaleString("id-ID")},-
              </td>
              <td align="right">${persen.toFixed(1)}%</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  </div>
`;
  
}

