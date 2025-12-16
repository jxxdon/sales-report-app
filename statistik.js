import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================
   ELEMENT
===================== */
const totalProspekEl   = document.getElementById("totalProspek");
const prospekBySales  = document.getElementById("prospekBySales");
const progressDataEl  = document.getElementById("progressData");
const aktivitasDataEl = document.getElementById("aktivitasData");
const titleRangeEl    = document.getElementById("titleRange");

const btnCurrent  = document.getElementById("btnCurrent");
const selectMonth = document.getElementById("selectMonth");
const selectYear  = document.getElementById("selectYear");

/* =====================
   STATE
===================== */
let mode  = "bulanan";                 // "bulanan" | "tahunan"
let month = new Date().getMonth();     // 0–11
let year  = new Date().getFullYear();

let rawProspek   = [];
let rawAktivitas = [];

/* =====================
   HELPER
===================== */
function toDate(ts) {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();   // Firestore Timestamp
  if (ts instanceof Date) return ts;   // JS Date
  return null;
}

function inRange(ts) {
  const d = toDate(ts);
  if (!d) return false;

  if (mode === "tahunan") {
    return d.getFullYear() === year;
  }

  return d.getFullYear() === year && d.getMonth() === month;
}

function bulanNama(i) {
  return [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ][i];
}

function percent(v, t) {
  return t ? ((v / t) * 100).toFixed(1) + "%" : "0%";
}

function row(label, value) {
  return `<div class="row"><span>${label}</span><span>${value}</span></div>`;
}

/* =====================
   RENDER
===================== */
function render() {

  /* ===== FILTER PROSPEK ===== */
  const prospek = rawProspek.filter(p =>
    p.userId !== "admin" &&
    inRange(p.createdAt)
  );

  /* ===== TITLE ===== */
  titleRangeEl.textContent =
    mode === "tahunan"
      ? `Statistik Tahun : ${year}`
      : `Statistik Bulan : ${bulanNama(month)} ${year}`;

  /* ===== TOTAL PROSPEK ===== */
  totalProspekEl.textContent = prospek.length;

  /* ===== PROSPEK PER SALES ===== */
  const bySales = {};
  prospek.forEach(p => {
    const s = p.namaUser || "Unknown";
    bySales[s] = (bySales[s] || 0) + 1;
  });

  prospekBySales.innerHTML = "";
  Object.keys(bySales).sort().forEach(s =>
    prospekBySales.innerHTML +=
      row(s, `${bySales[s]} orang / ${percent(bySales[s], prospek.length)}`)
  );

  /* ===== PROGRESS ===== */
  const progress = {};
  prospek.forEach(p => {
    const c = p.comments || [];
    if (!c.length) return;
    const last = c[c.length - 1].progress;
    progress[last] = (progress[last] || 0) + 1;
  });

  progressDataEl.innerHTML = "";
  Object.keys(progress).forEach(p =>
    progressDataEl.innerHTML += row(p, `${progress[p]} orang`)
  );

  /* ===== AKTIVITAS (STATUS DARI PROSPEK) ===== */
  const aktivitasSales = {};
  prospek.forEach(p => {
    const s = p.namaUser || "Unknown";
    aktivitasSales[s] ??= {
      Hot:0, Survey:0, Negosiasi:0,
      Booking:0, DP:0, Closing:0, Batal:0
    };

    const c = p.comments || [];
    if (!c.length) return;
    const last = c[c.length - 1].progress;
    if (aktivitasSales[s][last] !== undefined) {
      aktivitasSales[s][last]++;
    }
  });

  /* ===== AKTIVITAS LOG ===== */
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
  Object.keys(aktivitasSales).sort().forEach(s => {
    const a = aktivitasSales[s];
    aktivitasDataEl.innerHTML += row(
      s,
      `${input[s]||0} Input Baru , ${komentar[s]||0} Follow up, ` +
      `${a.Hot} Hot, ${a.Survey} Survey, ${a.Negosiasi} Negosiasi, ` +
      `${a.Booking} Booking, ${a.DP} DP, ${a.Closing} Closing, ${a.Batal} Batal`
    );
  });
}

/* =====================
   FIRESTORE LISTENER
===================== */
onSnapshot(collection(db, "prospek"), snap => {
  rawProspek = snap.docs.map(d => d.data());
  render();
});

onSnapshot(collection(db, "aktivitas"), snap => {
  rawAktivitas = snap.docs.map(d => d.data());
  render();
});

/* =====================
   FILTER EVENT
===================== */
btnCurrent.onclick = () => {
  const now = new Date();
  month = now.getMonth();
  year  = now.getFullYear();
  mode  = "bulanan";
  render();
};

selectMonth.onchange = e => {
  const idx = e.target.selectedIndex;

  // index 0 = label "Bulanan" → abaikan
  if (idx === 0) return;

  month = idx - 1;
  mode  = "bulanan";
  render();
};

selectYear.onchange = e => {
  year = Number(e.target.value);
  mode = "tahunan";
  render();
};
