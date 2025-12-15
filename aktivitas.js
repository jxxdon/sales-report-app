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

const modal = document.getElementById("detailModal");
const detailContent = document.getElementById("detailContent");
const commentList = document.getElementById("commentList");
const closeModal = document.querySelector(".close");

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

/* =====================
   OPEN PROSPEK FROM ACTIVITY
===================== */
function openProspekFromActivity(prospekId) {
  if (!prospekId) return alert("Prospek tidak ditemukan");

  onDocSnapshot(doc(db, "prospek", prospekId), snap => {
    if (!snap.exists()) {
      alert("Data prospek sudah dihapus");
      return;
    }

    const d = snap.data();

    detailContent.innerHTML = `
      <div style="white-space:pre-wrap">
        ${d.catatan || "-"}
      </div>
    `;

    commentList.innerHTML = "";
    (d.comments || []).forEach(c => {
      commentList.innerHTML += `
        <div style="margin-bottom:12px;">
          <strong>${c.progress}</strong> - ${c.text}<br>
          <small style="color:#666">
            ${c.user} ; ${formatDate(c.createdAt)}
          </small>
        </div>
      `;
    });

    modal.style.display = "flex";
  });
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
if (d.prospekId) {
  el.style.cursor = "pointer";
  el.onclick = () => {
    window.location.href =
      `list-prospek.html?open=${d.prospekId}`;
  };
} else {
  el.style.opacity = "0.6";
  el.style.cursor = "not-allowed";
}

    list.appendChild(el);
  });
});
if (closeModal && modal) {
  closeModal.onclick = () => {
    modal.style.display = "none";
  };
}
