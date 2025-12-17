import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  doc,
  onSnapshot as onDocSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const user = localStorage.getItem("user")?.trim().toLowerCase();
if (!user) location.href = "index.html";
const isAdmin = user === "admin";

const list = document.getElementById("activityList");

function formatDate(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

let q;
if (isAdmin) {
  q = query(collection(db, "aktivitas"), orderBy("createdAt", "desc"));
} else {
  q = query(
    collection(db, "aktivitas"),
    where("user", "==", user),
    orderBy("createdAt", "desc")
  );
}

function buildPesanDetail(d) {
  // INPUT PROSPEK BARU (FORMAT BARU)
  if (d.tipe === "INPUT_PROSPEK") {
    if (d.nama || d.telepon) {
      return `Input Prospek : ${d.nama || "-"} - ${d.telepon || "-"} - ${d.asal || "-"} - ${d.produk || "-"}`;
    }

    // FALLBACK LOG INPUT LAMA
    return d.pesan || "Input Prospek";
  }

  // KOMENTAR FORMAT BARU (DENGAN NAMA PROSPEK)
if (d.progress || d.komentar) {
  const nama = d.namaProspek ? `di Prospek ${d.namaProspek}` : "";
  return `Komentar ${nama} : ${d.progress || "-"} - ${d.komentar || "-"}`;
}


  // FALLBACK LOG KOMENTAR LAMA
  return d.pesan || "Komentar";
}

onSnapshot(q, snap => {
  list.innerHTML = "";

  if (snap.empty) {
    list.innerHTML = `<div class="empty">Belum ada aktivitas</div>`;
    return;
  }

  snap.forEach(docSnap => {
    const d = docSnap.data();
    const type = d.tipe === "INPUT_PROSPEK" ? "input" : "comment";

    const el = document.createElement("div");
    el.className = "card";

    el.innerHTML = `
      <div class="row">
        <div class="user">${d.user}</div>
        <div class="badge ${type}">
          ${type === "input" ? "Input Prospek" : "Komentar"}
        </div>
      </div>

      <div class="text">
  ${buildPesanDetail(d)}
</div>

      <div class="time">
        ${formatDate(d.createdAt)}
      </div>
    `;

el.style.cursor = "pointer";
el.onclick = () => {
  if (!d.prospekId) return;

  // simpan ID prospek yang diklik
  localStorage.setItem("openProspekId", d.prospekId);

  // pindah ke halaman prospek
  window.location.href = "list-prospek.html";
};

if (!d.prospekId) {
  el.style.opacity = "0.6";
  el.title = "Aktivitas lama";
}


    list.appendChild(el);
  });
});

