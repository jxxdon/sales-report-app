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
   LOAD PROSPEK + INIT
===================== */
onSnapshot(collection(db, "prospek"), snap => {
  const data = snap.docs.map(d => d.data());

  // guard: jangan render kalau belum ada data
  if (!data.length) return;

  prospek = data;
  initTipeDanSales();
});


/* =====================
   INIT TIPE & SALES
===================== */
function initTipeDanSales() {

  /* ===== TIPE IKLAN ===== */
  const tipeSet = new Set();

  prospek.forEach(p => {
    if (Array.isArray(p.tipeTertarik)) {
      p.tipeTertarik.forEach(t => {
        if (t && t.trim()) tipeSet.add(t.trim());
      });
    }
  });

  // fallback minimal
  const tipeList =
    tipeSet.size
      ? ["Umum", ...Array.from(tipeSet).sort()]
      : ["Umum"];

  tipeEl.innerHTML = "";
  tipeList.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent =
      t === "Umum" ? "Umum (Walk-in)" : t;
    tipeEl.appendChild(opt);
  });

  /* ===== SALES ===== */
  const salesSet = new Set(
    prospek
      .map(p => p.namaUser)
      .filter(s => s && s !== "admin")
  );

  salesEl.innerHTML = `<option value="">Semua Sales</option>`;

  if (!salesSet.size) {
    const opt = document.createElement("option");
    opt.disabled = true;
    opt.textContent = "Belum ada sales";
    salesEl.appendChild(opt);
    return;
  }

  Array.from(salesSet).sort().forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    salesEl.appendChild(opt);
  });
}

  /* ===== SALES ===== */
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
    if (!
