import { db } from "./firebase.js";
import { collection, onSnapshot } from
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================
   ELEMENT
===================== */
const totalProspekEl = document.getElementById("totalProspek");
const prospekBySalesEl = document.getElementById("prospekBySales");
const progressDataEl = document.getElementById("progressData");
const aktivitasDataEl = document.getElementById("aktivitasData");
const titleRangeEl = document.getElementById("titleRange");

const btnCurrent = document.getElementById("btnCurrent");
const selectMonth = document.getElementById("selectMonth");
const selectYear = document.getElementById("selectYear");

/* =====================
   STATE
===================== */
let month = new Date().getMonth();   // 0–11
let year = new Date().getFullYear();
let mode = "bulanan";               // bulanan | tahunan

let rawProspek = [];
let rawAktivitas = [];

/* =====================
   HELPER
===================== */
function getDate(ts) {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts instanceof Date) return ts;
  return null;
}

function inRange(ts) {
  const d = getDate(ts);
  if (!d) return false;

  if (mode === "tahunan") {
    return d.getFullYear() === year;
  }

  return d.getMonth() === month && d.getFullYear() === year;
}

function percent(v, t) {
  return t ? ((v / t) * 100).toFixed(1) + "%" : "0%";
}

function bulanNama(i) {
  return [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ][i];
}

function renderRow(label, value) {
  return `<div class="row"><span>${label}</span><span>${value}</span></div>`;
}

/* =====================
   RENDER
===================== */
function render() {
  const prospek = rawProspek.filter(p =>
    p.userId !== "admin" && inRange(p.createdAt)
  );

  /* TITLE */
  titleRangeEl.textContent =
    mode === "tahunan"
      ? `Statistik Tahun : ${year}`
      : `Statistik Bulan : ${bulanNama(month)} ${year}`;

  /* TOTAL */
  totalProspekEl.textContent = prospek.length;

  /* PROSPEK BY SALES */
  const bySales = {};
  prospek.forEach(p => {
    bySales[p.namaUser] = (bySales[p.namaUser] || 0) + 1;
  });

  prospekBySalesEl.innerHTML = "";
  Object.keys(bySales).sort().forEach(s =>
    prospekBySalesEl.innerHTML +=
      renderRow(s, `${bySales[s]} / ${percent(bySales[s], prospek.length)}`)
  );

  /* PROGRESS */
  const progress = {};
  prospek.forEach(p => {
    const c = p.comments || [];
    if (!c.length) return;
    const last = c[c.length - 1].progress;
    progress[last] = (progress[last] || 0) + 1;
  });

  progressDataEl.innerHTML = "";
  Object.keys(progress).forEach(p =>
    progressDataEl.innerHTML += renderRow(p, `${progress[p]} orang`)
  );

  /* AKTIVITAS */
  const aktivitas = {};
  prospek.forEach(p => {
    const s = p.namaUser;
    aktivitas[s] ||= {
      Hot:0, Survey:0, Negosiasi:0,
      Booking:0, DP:0, Closing:0, Batal:0
    };

    const c = p.comments || [];
    if (!c.length) return;
    const last = c[c.length - 1].progress;
    if (aktivitas[s][last] !== undefined) aktivitas[s][last]++;
  });

  const input = {};
  const komentar = {};

  rawAktivitas
    .filter(a => a.user !== "admin" && inRange(a.createdAt))
    .forEach(a => {
      if (a.tipe === "INPUT_PROSPEK")
        input[a.user] = (input[a.user] || 0) + 1;
      if (a.tipe === "KOMENTAR")
        komentar[a.user] = (komentar[a.user] || 0) + 1;
    });

  aktivitasDataEl.innerHTML = "";
  Object.keys(aktivitas).sort().forEach(s => {
    const a = aktivitas[s];
    aktivitasDataEl.innerHTML += renderRow(
      s,
      `${input[s]||0} Input, ${komentar[s]||0} Komentar,
       ${a.Hot} Hot, ${a.Survey} Survey, ${a.Negosiasi} Negosiasi,
       ${a.Booking} Booking, ${a.DP} DP, ${a.Closing} Closing, ${a.Batal} Batal`
    );
  });
}

/* =====================
   FIRESTORE
===================== */
onSnapshot(collection(db,"prospek"), snap => {
  rawProspek = snap.docs.map(d => d.data());
  render();
});

onSnapshot(collection(db,"aktivitas"), snap => {
  rawAktivitas = snap.docs.map(d => d.data());
  render();
});

/* =====================
   FILTER EVENT
===================== */
btnCurrent.onclick = () => {
  const now = new Date();
  month = now.getMonth();
  year = now.getFullYear();
  mode = "bulanan";
  render();
};

selectMonth.onchange = e => {
  month = e.target.selectedIndex - 1;
  mode = "bulanan";
  render();
};

selectYear.onchange = e => {
  year = Number(e.target.value);
  mode = "tahunan";
  render();
};
