import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================
   USER
===================== */
const user = localStorage.getItem("user")?.trim().toLowerCase();
if (!user) location.href = "index.html";
const isAdmin = user === "admin";

/* =====================
   ELEMENT
===================== */
const activityList = document.getElementById("activityList");

/* =====================
   HELPER
===================== */
function formatDate(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("id-ID", {
    day:"2-digit",
    month:"short",
    year:"2-digit",
    hour:"2-digit",
    minute:"2-digit",
    second:"2-digit"
  });
}

/* =====================
   QUERY (WAJIB INDEX)
===================== */
let q;

if (isAdmin) {
  q = query(
    collection(db, "aktivitas"),
    orderBy("createdAt", "desc")
  );
} else {
  q = query(
    collection(db, "aktivitas"),
    where("user", "==", user),
    orderBy("createdAt", "desc")
  );
}

/* =====================
   RENDER
===================== */
onSnapshot(q, snap => {
  activityList.innerHTML = "";

  if (snap.empty) {
    activityList.innerHTML = `
      <p style="text-align:center;color:#999;padding:40px">
        Belum ada aktivitas
      </p>
    `;
    return;
  }

  snap.forEach(docSnap => {
    const d = docSnap.data();

    const statusClass =
      d.tipe === "INPUT_PROSPEK"
        ? "status-personal"
        : "status-open";

    const card = document.createElement("div");
    card.className = "prospek-card";

    card.innerHTML = `
      <div class="nama">
        ${d.user}
      </div>

      <div class="info">
        ${d.pesan}
      </div>

      <div class="status-line">
        <span class="status ${statusClass}">
          ${formatDate(d.createdAt)}
        </span>
      </div>
    `;

    activityList.appendChild(card);
  });
});
