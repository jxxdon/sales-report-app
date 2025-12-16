import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================
   STATE
===================== */
let charts = {};
const now = new Date();
let selectedMonth = now.getMonth();
let selectedYear = now.getFullYear();

/* =====================
   HELPER
===================== */
function inRange(ts) {
  if (!ts?.toDate) return false;
  const d = ts.toDate();
  return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
}

function resetChart(id, config) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(document.getElementById(id), config);
}

function groupBy(arr, key) {
  return arr.reduce((a, c) => {
    const k = c[key] || "Unknown";
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {});
}

/* =====================
   LOAD PROSPEK
===================== */
onSnapshot(collection(db, "prospek"), snap => {
  const prospek = snap.docs
    .map(d => d.data())
    .filter(d => inRange(d.createdAt));

  // ===== PROSPEK PER SALES
  const bySales = groupBy(prospek, "namaUser");
  const salesNames = Object.keys(bySales);
  const salesCounts = Object.values(bySales);

  resetChart("chartProspek", {
    type: "line",
    data: {
      labels: salesNames,
      datasets: [{
        label: "Prospek",
        data: salesCounts,
        tension: .4
      }]
    },
    options: { responsive: true }
  });

  // ===== PROGRESS TERAKHIR
  const progress = {};
  prospek.forEach(p => {
    const c = p.comments || [];
    if (!c.length) return;
    const last = c[c.length - 1].progress;
    progress[last] = (progress[last] || 0) + 1;
  });

  resetChart("chartProgress", {
    type: "line",
    data: {
      labels: Object.keys(progress),
      datasets: [{
        label: "Progress",
        data: Object.values(progress),
        tension: .4
      }]
    }
  });

  // ===== PIE PER STATUS
  const makePie = (status, canvas) => {
    const data = {};
    prospek.forEach(p => {
      const c = p.comments || [];
      if (!c.length) return;
      const last = c[c.length - 1].progress;
      if (last === status) {
        const s = p.namaUser || "Unknown";
        data[s] = (data[s] || 0) + 1;
      }
    });

    resetChart(canvas, {
      type: "pie",
      data: {
        labels: Object.keys(data),
        datasets: [{ data: Object.values(data) }]
      }
    });
  };

  makePie("Survey", "chartSurvey");
  makePie("Booking", "chartBooking");
  makePie("Closing", "chartClosing");
  makePie("Batal", "chartBatal");
});

/* =====================
   AKTIVITAS
===================== */
onSnapshot(collection(db, "aktivitas"), snap => {
  const logs = snap.docs
    .map(d => d.data())
    .filter(d => inRange(d.createdAt));

  const input = {};
  const komentar = {};

  logs.forEach(l => {
    if (l.tipe === "INPUT_PROSPEK") {
      input[l.user] = (input[l.user] || 0) + 1;
    }
    if (l.tipe === "KOMENTAR") {
      komentar[l.user] = (komentar[l.user] || 0) + 1;
    }
  });

  resetChart("chartInput", {
    type: "pie",
    data: {
      labels: Object.keys(input),
      datasets: [{ data: Object.values(input) }]
    }
  });

  resetChart("chartKomentar", {
    type: "pie",
    data: {
      labels: Object.keys(komentar),
      datasets: [{ data: Object.values(komentar) }]
    }
  });
});
