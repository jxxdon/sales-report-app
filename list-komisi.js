import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { auth, db } from "./firebase.js";

import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const listEl = document.getElementById("listKomisi");

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const username = user.email.startsWith("admin")
    ? "admin"
    : user.email.split("@")[0];

  const colRef = collection(db, "laporan_penjualan");
  const q = username === "admin"
    ? colRef
    : query(colRef, where("sales", "==", username));

  onSnapshot(q, snap => {
    listEl.innerHTML = "";
    snap.docs.forEach(doc => {
      renderKomisi(doc.data());
    });
  });
});

function renderKomisi(x) {

  if (x.status === "Batal") return;

  const closingMonth = getClosingMonth(x);
  if (!closingMonth) return;

  const basePersen = getBasePersen(x.sales, closingMonth);
  const baseKomisi = basePersen * x.hargaHPP;

  const logs = hitungProgresKomisi(x, baseKomisi);

  logs.forEach(l => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="row">
        <strong>${x.namaPembeli || "-"}</strong>
        <span class="badge">${x.caraBayar}</span>
      </div>

      <div class="row small">
        ${x.tipeUnit || "-"} | Blok ${x.noBlok || "-"}
      </div>

      <div class="row small">
        Closing: ${closingMonth}
      </div>

      <div class="row">
        <span>${l.label}</span>
        <span class="money">
          Rp ${l.nilai.toLocaleString("id-ID")}
        </span>
      </div>
    `;

    listEl.appendChild(div);
  });
}

/* ===============================
   LOGIKA KOMISI
================================ */

function getClosingMonth(x) {
  if (x.caraBayar === "KPR" && x.status === "Lunas") {
    return monthKey(new Date());
  }

  if (
    (x.caraBayar === "Cash Keras" || x.caraBayar === "Cash Bertahap") &&
    x.status === "Down Payment"
  ) {
    return monthKey(new Date());
  }

  return null;
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

/* dummy urutan closing (simple version) */
function getBasePersen(sales, month) {
  // versi sederhana: selalu 1%
  // (bisa dikembangkan kalau mau hitung urutan real)
  return 0.01;
}

function hitungProgresKomisi(x, baseKomisi) {
  const hasil = [];
  const totalBayar = x.jumlahPembayaran || 0;
  const persenBayar = totalBayar / x.hargaJual;

  if (x.caraBayar === "KPR") {
    if (x.status === "Lunas") {
      hasil.push({
        label: "Komisi Pelunasan (90%)",
        nilai: baseKomisi * 0.9
      });
    }
    if (x.status === "Serah Terima") {
      hasil.push({
        label: "Komisi Serah Terima (10%)",
        nilai: baseKomisi * 0.1
      });
    }
  }

  if (x.caraBayar !== "KPR") {
    if (persenBayar >= 0.3) {
      hasil.push({
        label: "Komisi Progres 1 (30%)",
        nilai: baseKomisi * 0.3
      });
    }
    if (persenBayar >= 0.6) {
      hasil.push({
        label: "Komisi Progres 2 (30%)",
        nilai: baseKomisi * 0.3
      });
    }
    if (x.status === "Lunas") {
      hasil.push({
        label: "Komisi Progres 3 (30%)",
        nilai: baseKomisi * 0.3
      });
    }
    if (x.status === "Serah Terima") {
      hasil.push({
        label: "Komisi Keempat (10%)",
        nilai: baseKomisi * 0.1
      });
    }
  }

  return hasil;
}
