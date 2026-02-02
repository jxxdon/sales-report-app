import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


let currentPenjualanId = null;
let currentEditIndex = null;

function closeModalBayar() {
  document.getElementById("modalBayar").style.display = "none";
  currentPenjualanId = null;
}
window.closeModalBayar = closeModalBayar;

const listEl = document.getElementById("list");

onSnapshot(collection(db, "laporan_penjualan"), snap => {
  listEl.innerHTML = "";

  snap.docs.forEach(doc => {
    const x = doc.data();

    const tanggal =
      x.tanggalBooking?.toDate?.()
        ?.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"2-digit"})
        || "-";

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="header">
        ${tanggal} | ${x.sales} | ${x.caraBayar}
      </div>

      <div class="unit">
        ${x.tipeUnit} | Blok ${x.noBlok}
      </div>

      <div class="price">
        Rp ${x.hargaJual.toLocaleString("id-ID")}
        <span class="small">
          | HPP Rp ${x.hargaHPP.toLocaleString("id-ID")}
        </span>
      </div>
      
<div class="small">
  ${x.namaPembeli} - ${x.noTelpPembeli || "-"}
</div>

<div class="small">
  Jumlah Dibayar :
  Rp ${(x.jumlahPembayaran || 0).toLocaleString("id-ID")}
</div>

<div class="small">
  Sisa Pembayaran :
  Rp ${(x.hargaJual - (x.jumlahPembayaran || 0)).toLocaleString("id-ID")}
</div>


      <div class="status">
        Status : ${x.status || "Booking"}
      </div>

      <div class="actions">
  <button class="btn btn-update-data" data-id="${doc.id}">
    Update Data
  </button>
  <button class="btn btn-update-bayar" data-id="${doc.id}">
    Update Pembayaran
  </button>
  <button class="btn btn-update-status" data-id="${doc.id}">
    Update Status
  </button>
</div>


  ${[
  ...(x.riwayatUpdate || []),
  ...(x.pembayaran || []).map(p => ({
    tanggal: p.tanggal,
    catatan: `${p.catatan || "-"} | Bayar : Rp ${p.jumlah.toLocaleString("id-ID")}`,
    createdAt: p.createdAt
  }))
]
.sort((a, b) => {
  const ta = a.createdAt?.seconds || a.createdAt?.getTime?.() || 0;
  const tb = b.createdAt?.seconds || b.createdAt?.getTime?.() || 0;
  return tb - ta; // TERBARU DI ATAS
})
.map(h => `
  <div class="payment-note">
    ${h.tanggal} | ${h.catatan}
  </div>
`).join("")}



    `;

    listEl.appendChild(card);
  });

  if (!snap.size) {
    listEl.innerHTML = "<p>Belum ada data penjualan</p>";
  }
});

// ===== EVENT TOMBOL CARD (WAJIB DI LUAR onSnapshot) =====
listEl.addEventListener("click", async e => {

  /* ===== PRIORITAS: LINK EDIT / DELETE ===== */
  if (e.target.classList.contains("pay-delete")) {
    e.preventDefault();

    const id  = e.target.dataset.id;
    const idx = Number(e.target.dataset.idx);

    if (!confirm("Hapus pembayaran ini?")) return;

    const snap = await getDoc(doc(db, "laporan_penjualan", id));
    const data = snap.data();

    const pembayaranBaru = data.pembayaran.filter((_, i) => i !== idx);
    const totalBayar = pembayaranBaru.reduce((s, p) => s + p.jumlah, 0);

    await updateDoc(doc(db, "laporan_penjualan", id), {
      pembayaran: pembayaranBaru,
      jumlahPembayaran: totalBayar
    });

    return;
  }

  if (e.target.classList.contains("pay-edit")) {
    e.preventDefault();

    const id  = e.target.dataset.id;
    const idx = Number(e.target.dataset.idx);

    const snap = await getDoc(doc(db, "laporan_penjualan", id));
    const p = snap.data().pembayaran[idx];

    currentPenjualanId = id;
    currentEditIndex = idx;

    document.getElementById("bayarTanggal").value =
      new Date(p.createdAt.seconds * 1000).toISOString().slice(0,10);
    document.getElementById("bayarJumlah").value = p.jumlah;
    document.getElementById("bayarCatatan").value = p.catatan || "";

    document.getElementById("modalBayar").style.display = "block";
    return;
  }

  /* ===== BARU HANDLE BUTTON ===== */
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;
  if (!id) return;

 if (btn.classList.contains("btn-update-data")) {
  const ref = doc(db, "laporan_penjualan", id);
  const snap = await getDoc(ref);
  const lama = snap.data();

  // ambil input baru
  const baru = {
    namaPembeli: prompt("Nama Pembeli", lama.namaPembeli || ""),
    noTelpPembeli: prompt("No. Telp", lama.noTelpPembeli || ""),
    sales: prompt("Sales", lama.sales || ""),
    caraBayar: prompt("Cara Bayar", lama.caraBayar || ""),
    tipeUnit: prompt("Tipe Unit", lama.tipeUnit || ""),
    noBlok: prompt("No Blok", lama.noBlok || "")
  };

  // kalau user cancel di salah satu prompt
  if (Object.values(baru).some(v => v === null)) return;

  const updateData = {};
  const history = [];

  const label = {
    namaPembeli: "Nama",
    noTelpPembeli: "No Telp",
    sales: "Sales",
    caraBayar: "Cara Bayar",
    tipeUnit: "Tipe Unit",
    noBlok: "No Blok"
  };

  for (const key in baru) {
    if ((baru[key] || "") !== (lama[key] || "")) {
      updateData[key] = baru[key];

      history.push({
        tanggal: new Date().toLocaleDateString("id-ID"),
        catatan: `Update data ${label[key]} ; ${lama[key] || "-"} jadi ${baru[key]}`,
        createdAt: new Date()
      });
    }
  }

  // kalau tidak ada yang berubah → stop
  if (!history.length) return;

  await updateDoc(ref, {
    ...updateData,
    riwayatUpdate: arrayUnion(...history)
  });

  return;
}


  if (btn.classList.contains("btn-update-bayar")) {
    currentPenjualanId = id;
    document.getElementById("modalBayar").style.display = "block";
  }

 if (btn.classList.contains("btn-update-status")) {
  const ref = doc(db, "laporan_penjualan", id);
  const snap = await getDoc(ref);
  const data = snap.data();

  const statusLama = data.status || "Booking";

  const statusValid = [
    "Booking",
    "Down Payment",
    "Proses Pelunasan",
    "Lunas",
    "Batal"
  ];

  const statusBaru = prompt(
    "Pilih Status:\n" + statusValid.join(" / "),
    statusLama
  );

  if (!statusBaru || !statusValid.includes(statusBaru)) return;
  if (statusBaru === statusLama) return;

  await updateDoc(ref, {
    status: statusBaru,
    riwayatUpdate: arrayUnion({
      tanggal: new Date().toLocaleDateString("id-ID"),
      catatan: `Status berubah dari ${statusLama} menjadi ${statusBaru}`,
      createdAt: new Date()
    })
  });

  return;
}

});


document.getElementById("btnSimpanBayar").onclick = async () => {
  if (!currentPenjualanId) return;

  const tgl = document.getElementById("bayarTanggal").value;
  const jml = Number(document.getElementById("bayarJumlah").value);
  const cat = document.getElementById("bayarCatatan").value;

  if (!tgl || !jml) {
    alert("Lengkapi tanggal & jumlah");
    return;
  }

  const ref = doc(db, "laporan_penjualan", currentPenjualanId);
  const snap = await getDoc(ref);
  const data = snap.data();

  let pembayaran = data.pembayaran || [];

  if (currentEditIndex !== null) {
    // MODE EDIT
    pembayaran[currentEditIndex] = {
      ...pembayaran[currentEditIndex],
      tanggal: new Date(tgl).toLocaleDateString("id-ID"),
      jumlah: jml,
      catatan: cat
    };
  } else {
    // MODE TAMBAH
    pembayaran.push({
      tanggal: new Date(tgl).toLocaleDateString("id-ID"),
      jumlah: jml,
      catatan: cat,
      createdAt: new Date()
    });
  }

  const totalBayar = pembayaran.reduce((s, p) => s + p.jumlah, 0);

  await updateDoc(ref, {
    pembayaran,
    jumlahPembayaran: totalBayar
  });

  currentEditIndex = null;
  closeModalBayar();
};
