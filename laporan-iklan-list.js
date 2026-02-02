import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const listEl = document.getElementById("list");

const q = query(
  collection(db, "laporan_iklan"),
  orderBy("createdAt", "desc")
);

onSnapshot(q, snap => {
  listEl.innerHTML = "";

  snap.docs.forEach(d => {
    const x = d.data();

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="row"><b>Platform</b><span>${x.platform}</span></div>
      <div class="row"><b>Iklan</b><span>${x.tipeIklan}</span></div>
      <div class="row"><b>Sales</b><span>${x.sales}</span></div>
      <div class="row"><b>Periode</b>
        <span>
          ${x.startDate.toDate().toLocaleDateString("id-ID")}
          -
          ${x.endDate.toDate().toLocaleDateString("id-ID")}
        </span>
      </div>
      <div class="row"><b>Lead</b><span>${x.jumlahLead}</span></div>
      <div class="row"><b>CPL</b>
        <span>Rp ${x.cpl.toLocaleString("id-ID")}</span>
      </div>
    `;

    listEl.appendChild(card);
  });

  if (!snap.size) {
    listEl.innerHTML = "<p>Belum ada laporan iklan</p>";
  }
});
