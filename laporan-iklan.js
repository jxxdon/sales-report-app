import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================
   ELEMENT
===================== */
const platformEl = document.getElementById("platform");
const tipeEl     = document.getElementById("tipeIklan");
const salesEl    = document.getElementById("salesSelect");
const startEl    = document.getElementById("startDate");
const endEl      = document.getElementById("endDate");
const anggaranEl = document.getElementById("anggaran");
const hasilEl    = document.getElementById("hasil");
const btnHitung  = document.getElementById("btnHitung");

/* =====================
   DATA
===================== */
let prospek = [];

/* =====================
   PLATFORM MAP
===================== */
const PLATFORM_MAP = {
  META: ["instagram", "facebook", "iklan official"],
  TIKTOK: ["tiktok"]
};

/* =====================
   LOAD PROSPEK
===================== */
onSnapshot(collection(db, "prospek"), snap => {
  prospek = snap.docs.map(d => d.data());
  if (!prospek.length) return;
  initTipeDanSales();
});

/* =====================
   INIT TIPE & SALES
===================== */
function initTipeDanSales() {

  // ===== TIPE IKLAN =====
  const tipeSet = new Set();
  prospek.forEach(p => {
    if (Array.isArray(p.tipeTertarik)) {
      p.tipeTertarik.forEach(t => {
        if (t && t.trim()) tipeSet.add(t.trim());
      });
    }
  });

  const tipeList = ["Umum", ...Array.from(tipeSet).sort()];
  tipeEl.innerHTML = "";

  tipeList.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t === "Umum" ? "Umum (Walk-in)" : t;
    tipeEl.appendChild(opt);
  });

  // ===== SALES =====
  const salesSet = new Set(
    prospek
      .map(p => p.namaUser)
      .filter(s => s && s !== "admin")
  );

  salesEl.innerHTML = `<option value="">Semua Sales</option>`;
  Array.from(salesSet).sort().forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    salesEl.appendChild(opt);
  });
}

/* =====================
   HITUNG & SIMPAN
===================== */
btnHitung.onclick = async () => {

  const platform  = platformEl.value;
  const tipeIklan = tipeEl.value;
  const sales     = salesEl.value;
  const startDate = new Date(startEl.value);
  const endDate   = new Date(endEl.value + " 23:59:59");
  const anggaran  = Number(anggaranEl.value);

  if (!startEl.value || !endEl.value || !anggaran) {
    alert("Lengkapi semua data");
    return;
  }

  const hasil = prospek.filter(p => {
    const d = p.createdAt?.toDate?.();
    if (!d) return false;
    if (d < startDate || d > endDate) return false;
    if (!PLATFORM_MAP[platform].includes(
      (p.asalProspek || "").toLowerCase()
    )) return false;
    if (sales && p.namaUser !== sales) return false;

    if (tipeIklan === "Umum") {
      return !p.tipeTertarik || p.tipeTertarik.length === 0;
    }
    return (p.tipeTertarik || []).includes(tipeIklan);
  });

  const jumlahLead = hasil.length;
  const cpl = jumlahLead ? Math.round(anggaran / jumlahLead) : 0;

  hasilEl.style.display = "block";
  hasilEl.innerHTML = `
    <div><b>Lead</b>: ${jumlahLead}</div>
    <div><b>CPL</b>: Rp ${cpl.toLocaleString("id-ID")}</div>
  `;

  await addDoc(collection(db, "laporan_iklan"), {
    createdAt: new Date(),
    startDate,
    endDate,
    platform,
    tipeIklan,
    sales: sales || "ALL",
    anggaran,
    jumlahLead,
    cpl
  });
};
