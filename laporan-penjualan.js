import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ===== ELEMENT ===== */
const tanggalBookingEl = document.getElementById("tanggalBooking");
const namaPembeliEl   = document.getElementById("namaPembeli");
const telpPembeliEl   = document.getElementById("telpPembeli");
const tipeUnitEl      = document.getElementById("tipeUnit");
const noBlokEl        = document.getElementById("noBlok");
const hargaJualEl     = document.getElementById("hargaJual");
const hargaHPPEl      = document.getElementById("hargaHPP");
const salesEl         = document.getElementById("salesSelect");
const bayarEl         = document.getElementById("jumlahBayar");
const caraBayarEl     = document.getElementById("caraBayar");
const inclPPNEl       = document.getElementById("inclPPN");
const inclBPHTBEl     = document.getElementById("inclBPHTB");
const inclAJBEl       = document.getElementById("inclAJB");
const catatanEl       = document.getElementById("catatan");
const btnSimpan       = document.getElementById("btnSimpan");

/* ===== DATA ===== */
let prospek = [];

/* ===== LOAD PROSPEK ===== */
onSnapshot(collection(db, "prospek"), snap => {
  prospek = snap.docs.map(d => d.data());
  initTipeUnit();
  initSales();
});

/* ===== TIPE UNIT (dari tipeTertarik, filter data sampah) ===== */
function initTipeUnit() {
  const set = new Set();

  prospek.forEach(p => {
    (p.tipeTertarik || []).forEach(t => {
      if (!t) return;
      const v = t.toLowerCase();
      if (v === "tertarik" || v === "prospek") return;
      set.add(t);
    });
  });

  tipeUnitEl.innerHTML = "";
  [...set].sort().forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    tipeUnitEl.appendChild(opt);
  });
}

/* ===== SALES (reuse dari prospek) ===== */
function initSales() {
  const set = new Set(
    prospek.map(p => p.namaUser).filter(s => s && s !== "admin")
  );

  salesEl.innerHTML = "";
  [...set].sort().forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    salesEl.appendChild(opt);
  });
}

/* ===== AUTO ISI TELP DARI PROSPEK ===== */
namaPembeliEl.onblur = () => {
  const nama = namaPembeliEl.value.toLowerCase();
  const p = prospek.find(x =>
    (x.nama || "").toLowerCase() === nama
  );
  if (p?.noTelp) {
    telpPembeliEl.value = p.noTelp;
  }
};

/* ===== SIMPAN ===== */
btnSimpan.onclick = async () => {
  if (!tanggalBookingEl.value || !namaPembeliEl.value) {
    alert("Lengkapi data wajib");
    return;
  }

  await addDoc(collection(db, "laporan_penjualan"), {
    tanggalBooking: new Date(tanggalBookingEl.value),
    namaPembeli: namaPembeliEl.value,
    noTelpPembeli: telpPembeliEl.value,
    tipeUnit: tipeUnitEl.value,
    noBlok: noBlokEl.value,
    hargaJual: Number(hargaJualEl.value),
    hargaHPP: Number(hargaHPPEl.value),
    sales: salesEl.value,
    jumlahPembayaran: Number(bayarEl.value),
    caraBayar: caraBayarEl.value,
    termasuk: {
      ppn: inclPPNEl.checked,
      bphtb: inclBPHTBEl.checked,
      ajb: inclAJBEl.checked
    },
    catatan: catatanEl.value || "",
    createdAt: new Date()
  });

  alert("Laporan penjualan tersimpan");
};
