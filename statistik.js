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
   INIT YEAR DROPDOWN (AUTO)
===================== */
const currentYear = new Date().getFullYear();
selectYear.innerHTML = "";

for (let y = currentYear - 1; y <= currentYear; y++) {
  const opt = document.createElement("option");
  opt.value = y;
  opt.textContent = y;
  if (y === currentYear) opt.selected = true;
  selectYear.appendChild(opt);
}

year = currentYear;
selectYear.value = currentYear;

const asalProspekDataEl = document.getElementById("asalProspekData");
const ketertarikanDataEl = document.getElementById("ketertarikanData");
const asalKotaDataEl = document.getElementById("asalKotaData");

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

  /* ===== FILTER PROSPEK (FIX) ===== */
const prospek = rawProspek.filter(p =>
  p.namaUser !== "admin" &&
  (
    !p.createdAt ||          // prospek lama (tanpa tanggal)
    inRange(p.createdAt)     // prospek baru (ikut filter)
  )
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
/* ===== ASAL PROSPEK ===== */
const asalMap = {};
prospek.forEach(p => {
  const asal = p.asalProspek || "Tidak Diketahui";
  asalMap[asal] = (asalMap[asal] || 0) + 1;
});

asalProspekDataEl.innerHTML = "";
asalProspekDataEl.innerHTML +=
  row("Total", prospek.length + " prospek");

Object.keys(asalMap).sort().forEach(a => {
  asalProspekDataEl.innerHTML +=
    row(
      a,
      `${asalMap[a]} / ${percent(asalMap[a], prospek.length)}`
    );
});
  
/* ===== ASAL KOTA (FIX FINAL) ===== */
const kotaMap = {};

prospek.forEach(p => {
  const kota =
    (p.asalKota && p.asalKota.trim()) ||
    (p.kota && p.kota.trim()) ||
    (p.asal && p.asal.trim()) ||
    "Tidak Diketahui";

  kotaMap[kota] = (kotaMap[kota] || 0) + 1;
});

asalKotaDataEl.innerHTML = "";
asalKotaDataEl.innerHTML +=
  row("Total", prospek.length + " prospek");

Object.keys(kotaMap).sort().forEach(k => {
  asalKotaDataEl.innerHTML +=
    row(
      k,
      `${kotaMap[k]} / ${percent(kotaMap[k], prospek.length)}`
    );
});

/* ===== KETERTARIKAN PROSPEK (STRICT) ===== */
const ketertarikanMap = {};

// 🔒 daftar produk yang SAH
const PRODUK_VALID = [
  "Arion",
  "Carina",
  "Dorado",
  "Leonis",
  "Lyra",
  "Myra",
  "Nashira",
  "Vella",
  "Volands"
];

prospek.forEach(p => {
  let list = p.tipeTertarik;
  if (!list) return;

  if (typeof list === "string") {
    list = list.split(",").map(x => x.trim());
  }

  if (!Array.isArray(list)) return;

  list.forEach(item => {
    if (!PRODUK_VALID.includes(item)) return; // 🔥 FILTER UTAMA
    ketertarikanMap[item] = (ketertarikanMap[item] || 0) + 1;
  });
});

ketertarikanDataEl.innerHTML = "";
ketertarikanDataEl.innerHTML +=
  row("Total", prospek.length + " prospek");

Object.keys(ketertarikanMap).sort().forEach(k => {
  ketertarikanDataEl.innerHTML +=
    row(
      k,
      `${ketertarikanMap[k]} / ${percent(ketertarikanMap[k], prospek.length)}`
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

document.getElementById("btnCetakSales").onclick = () => {
  window.location.href = "laporan-sales.html";
};
