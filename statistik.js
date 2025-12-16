import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
let month = new Date().getMonth();
let year = new Date().getFullYear();

/* =====================
   HELPER
===================== */
function inRange(ts) {
  if (!ts?.toDate) return false;
  const d = ts.toDate();
  return d.getMonth() === month && d.getFullYear() === year;
}

function percent(v, t) {
  if (!t) return "0%";
  return ((v / t) * 100).toFixed(1) + "%";
}

function renderRow(label, value) {
  return `<div class="row"><span>${label}</span><span>${value}</span></div>`;
}

function bulanNama(i) {
  return [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ][i];
}

/* =====================
   LOAD DATA
===================== */
onSnapshot(collection(db, "prospek"), snap => {
  const prospek = snap.docs
    .map(d => d.data())
    .filter(d =>
      d.namaUser !== "admin" &&
      inRange(d.createdAt)
    );

  /* ===== TOTAL ===== */
  totalProspekEl.textContent = prospek.length;

  /* ===== BY SALES ===== */
  const bySales = {};
  prospek.forEach(p => {
    bySales[p.namaUser] = (bySales[p.namaUser] || 0) + 1;
  });

  prospekBySalesEl.innerHTML = "";
  Object.keys(bySales).sort().forEach(sales => {
    prospekBySalesEl.innerHTML += renderRow(
      sales,
      `${bySales[sales]} orang / ${percent(bySales[sales], prospek.length)}`
    );
  });

  /* ===== PROGRESS ===== */
  const progress = {};
  prospek.forEach(p => {
    const c = p.comments || [];
    if (!c.length) return;
    const last = c[c.length - 1].progress;
    progress[last] = (progress[last] || 0) + 1;
  });

  progressDataEl.innerHTML = "";
  Object.keys(progress).forEach(p => {
    progressDataEl.innerHTML += renderRow(p, `${progress[p]} orang`);
  });

  /* ===== AKTIVITAS PER SALES (DARI PROSPEK) ===== */
  const aktivitasSales = {};

  prospek.forEach(p => {
    const s = p.namaUser;
    if (!aktivitasSales[s]) {
      aktivitasSales[s] = {
        Hot:0, Survey:0, Negosiasi:0,
        Booking:0, DP:0, Closing:0, Batal:0
      };
    }

    const c = p.comments || [];
    if (!c.length) return;
    const last = c[c.length - 1].progress;
    if (aktivitasSales[s][last] !== undefined) {
      aktivitasSales[s][last]++;
    }
  });

  /* ===== AKTIVITAS DARI LOG ===== */
  onSnapshot(collection(db, "aktivitas"), snap2 => {
    const logs = snap2.docs
      .map(d => d.data())
      .filter(d =>
        d.user !== "admin" &&
        inRange(d.createdAt)
      );

    const input = {};
    const komentar = {};

    logs.forEach(l => {
      if (l.tipe === "INPUT_PROSPEK")
        input[l.user] = (input[l.user] || 0) + 1;
      if (l.tipe === "KOMENTAR")
        komentar[l.user] = (komentar[l.user] || 0) + 1;
    });

    aktivitasDataEl.innerHTML = "";

    Object.keys(aktivitasSales).sort().forEach(s => {
      const a = aktivitasSales[s];
      aktivitasDataEl.innerHTML += renderRow(
        s,
        `${input[s]||0} Input Baru , ${komentar[s]||0} Komentar, ` +
        `${a.Hot} Hot, ${a.Survey} Survey, ${a.Negosiasi} Negosiasi, ` +
        `${a.Booking} Booking, ${a.DP} DP, ${a.Closing} Closing, ${a.Batal} Batal`
      );
    });
  });

  /* ===== TITLE ===== */
  titleRangeEl.textContent =
    `Statistik Bulan : ${bulanNama(month)} ${year}`;
});

/* =====================
   FILTER EVENT
===================== */
btnCurrent.onclick = () => {
  const now = new Date();
  month = now.getMonth();
  year = now.getFullYear();
};

selectMonth.onchange = e => {
  month = e.target.selectedIndex - 1;
};

selectYear.onchange = e => {
  year = Number(e.target.value);
};
