import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  doc,
  updateDoc,
  arrayUnion,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

let currentPenjualanId = null;

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
        Sisa Pembayaran :
        Rp ${(x.hargaJual - x.jumlahPembayaran).toLocaleString("id-ID")}
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


      ${(x.pembayaran || []).map(p => `
        <div class="payment-note">
          ${p.tanggal} | Bayar :
          Rp ${p.jumlah.toLocaleString("id-ID")} |
          Kurang Rp ${(x.hargaJual - p.totalBayar).toLocaleString("id-ID")}
          [edit] [delete]
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
listEl.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;
  if (!id) return;

  if (btn.classList.contains("btn-update-data")) {
    alert("Update Data: " + id);
  }

 if (btn.classList.contains("btn-update-bayar")) {
  currentPenjualanId = id;
  document.getElementById("modalBayar").style.display = "block";
}

  if (btn.classList.contains("btn-update-status")) {
    alert("Update Status: " + id);
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

  await updateDoc(
    doc(db, "laporan_penjualan", currentPenjualanId),
    {
      pembayaran: arrayUnion({
        tanggal: new Date(tgl).toLocaleDateString("id-ID"),
        jumlah: jml,
        catatan: cat,
        createdAt: new Date()
      }),
      jumlahPembayaran: increment(jml)
    }
  );

  closeModalBayar();
};
