import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ===== ELEMENT ===== */
const tipeUnitEl   = document.getElementById("tipeUnit");
const salesEl      = document.getElementById("salesSelect");
const hargaJualEl  = document.getElementById("hargaJual");
const bayarEl      = document.getElementById("jumlahBayar");
const sisaEl       = document.getElementById("sisaBayar");
const btnSimpan    = document.getElementById("btnSimpan");

/* ===== DATA ===== */
let prospek = [];

/* ===== LOAD DATA PROSPEK ===== */
onSnapshot(collection(db, "prospek"), snap => {
  prospek = snap.docs.map(d => d.data());
  initTipeUnit();
  initSales();
});

/* ===== INIT TIPE UNIT (DARI tipeTertarik) ===== */
function initTipeUnit() {
  const set = new Set();

  prospek.forEach(p => {
    (p.tipeTertarik || []).forEach(t => {
      if (t && t.toLowerCase() !== "tertarik") {
        set.add(t);
      }
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


/* ===== INIT SALES ===== */
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

/* ===== HITUNG SISA ===== */
function hitungSisa() {
  const jual = Number(hargaJualEl.value) || 0;
  const bayar = Number(bayarEl.value) || 0;
  sisaEl.value = jual - bayar;
}
hargaJualEl.oninput = hitungSisa;
bayarEl.oninput = hitungSisa;

/* ===== SIMPAN ===== */
btnSimpan.onclick = async () => {
  await addDoc(collection(db, "laporan_penjualan"), {
    tanggalBooking: new Date(
      document.getElementById("tanggalBooking").value
    ),
    tipeUnit: tipeUnitEl.value,
    noBlok: document.getElementById("noBlok").value,
    hargaJual: Number(hargaJualEl.value),
    hargaHPP: Number(document.getElementById("hargaHPP").value),
    sales: salesEl.value,
    jumlahPembayaran: Number(bayarEl.value),
    sisaPembayaran: Number(sisaEl.value),
    createdAt: new Date()
  });

  alert("Laporan penjualan tersimpan");
};
