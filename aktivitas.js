import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth, db } from "./firebase.js";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

let currentUser = null;
let isAdmin = false;

// ================== AUTH GUARD ==================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;
  isAdmin = user.email === "admin@kostory.kost";

  initAktivitas();
});

// ================== INIT ==================

    async function initAktivitas() {
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
    q = query(
      collection(db, "aktivitas"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  } else {
    q = query(
      collection(db, "aktivitas"),
      where("user", "==", currentUser.email.split("@")[0]),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }

  function buildPesanDetail(d) {
    if (d.tipe === "INPUT_PROSPEK") {
      return `Input Prospek : ${d.nama || "-"} - ${d.telepon || "-"} - ${d.asal || "-"} - ${d.produk || "-"}`;
    }

    const nama = d.namaProspek ? `di Prospek ${d.namaProspek}` : "";
    return `Komentar ${nama} : ${d.progress || "-"} - ${d.komentar || "-"}`;
  }

  list.innerHTML = "";

  const snap = await getDocs(q);

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
        <div class="user">Sales ${d.user?.replace("sales", "") || "-"}</div>
        <div class="badge ${type}">
          ${type === "input" ? "Input Prospek" : "Komentar"}
        </div>
      </div>

      <div class="text">${buildPesanDetail(d)}</div>
      <div class="time">${formatDate(d.createdAt)}</div>
    `;

    if (d.prospekId) {
      el.style.cursor = "pointer";
      el.onclick = () => {
        localStorage.setItem("openProspekId", d.prospekId);
        window.location.href = "list-prospek.html";
      };
    } else {
      el.style.opacity = "0.6";
      el.title = "Aktivitas lama";
    }

    list.appendChild(el);
  });
}
