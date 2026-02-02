import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ========= ELEMENT ========= */
const platformEl  = document.getElementById("platform");
const tipeEl      = document.getElementById("tipeIklan");
const startEl     = document.getElementById("startDate");
const endEl       = document.getElementById("endDate");
const anggaranEl  = document.getElementById("anggaran");
const hasilEl     = document.getElementById("hasil");
const btnHitung   = document.getElementById("btnHitung");

/* ========= DATA ========= */
let prospek = [];

/* ========= LOAD PROSPEK ========= */
onSnapshot(collection(db, "prospek"), snap => {
  prospek = snap.docs.map(d => d.data());
});

/* ========= PLATFORM MAP ========= */
const PLATFORM_MAP = {
  META: ["instagram", "facebook", "iklan official"],
  TIKTOK: ["tiktok"]
};

/* ========= HITUNG ========= */
btnHitung.onclick = async () => {
  const platform  = platformEl.value;
  const tipeIklan = tipeEl.value;
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

    // periode
    if (d < startDate || d > endDate) return false;

    // platform
    if (!PLATFORM_MAP[platform].includes(
      (p.asalProspek || "").toLowerCase()
    )) return false;

    // tipe iklan
    if (tipeIklan === "Umum") {
      return !p.tipeTertarik || p.tipeTertarik.length === 0;
    }

    return (p.tipeTertarik || []).includes(tipeIklan);
  });

  const jumlahLead = hasil.length;
  const cpl = jumlahLead
    ? Math.round(anggaran / jumlahLead)
    : 0;

  /* ========= TAMPILKAN HASIL ========= */
  hasilEl.style.display = "block";
  hasilEl.innerHTML = `
    <div class="row"><strong>Jumlah Lead</strong><span>${jumlahLead}</span></div>
    <div class="row"><strong>Anggaran</strong><span>Rp ${anggaran.toLocaleString()}</span></div>
    <div class="row"><strong>Cost / Lead</strong><span>Rp ${cpl.toLocaleString()}</span></div>
  `;

  /* ========= SIMPAN ========= */
  await addDoc(collection(db, "laporan_iklan"), {
    createdAt: new Date(),
    startDate,
    endDate,
    platform,
    tipeIklan,
    anggaran,
    jumlahLead,
    cpl
  });
};
