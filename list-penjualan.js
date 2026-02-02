import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
        <button class="btn">Update Data</button>
        <button class="btn">Update Pembayaran</button>
        <button class="btn">Update Status</button>
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
