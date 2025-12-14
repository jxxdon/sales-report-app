import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
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
        ${d.pesan}
      </div>

      <div class="time">
        ${formatDate(d.createdAt)}
      </div>
    `;

    list.appendChild(el);
  });
});
