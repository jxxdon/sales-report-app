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
function formatDate(d) {
  const date = d.toDate ? d.toDate() : new Date(d);
  return date.toLocaleString("id-ID", {
    day:"2-digit", month:"2-digit", year:"2-digit",
    hour:"2-digit", minute:"2-digit", second:"2-digit"
  });
}

/* =====================
   QUERY (ROLE-BASED)
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
   LOAD DATA
===================== */
onSnapshot(q, snap => {
  activityList.innerHTML = "";

  if (snap.empty) {
    activityList.innerHTML =
      "<p style='color:#999;padding:30px;text-align:center'>Belum ada aktivitas</p>";
    return;
  }

  snap.forEach(docSnap => {
    const d = docSnap.data();

    const item = document.createElement("div");
    item.className = "prospek-card"; // reuse card style

    item.innerHTML = `
      <div style="font-size:.85em;color:#666;margin-bottom:6px">
        ${formatDate(d.createdAt)}
      </div>
      <div>
        <strong>${d.user}</strong> - ${d.pesan}
      </div>
    `;

    activityList.appendChild(item);
  });
});
