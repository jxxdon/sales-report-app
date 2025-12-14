import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const user = localStorage.getItem("user");
if (!user) {
  window.location.href = "index.html";
}

const isAdmin = user === "admin";
const prospekBody = document.getElementById("prospekBody");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("detailModal");
const closeModal = document.querySelector(".close");
const detailContent = document.getElementById("detailContent");
const commentsList = document.getElementById("commentsList");
let currentDocId = null;

// ... (bagian atas sama, sampai loadProspek)

// Load daftar prospek
function loadProspek(searchTerm = "") {
  const prospekList = document.getElementById("prospekList");
  prospekList.innerHTML = "";

  let q;
  if (searchTerm) {
    q = query(collection(db, "prospek"), orderBy("createdAt", "desc"));
  } else {
    if (isAdmin) {
      q = query(collection(db, "prospek"), orderBy("createdAt", "desc"));
    } else {
      q = query(collection(db, "prospek"), where("user", "==", user), orderBy("createdAt", "desc"));
    }
  }

  onSnapshot(q, (snapshot) => {
    prospekList.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      if (searchTerm && 
          !data.nama.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !data.noTelp.includes(searchTerm)) {
        return;
      }

      const status = getStatusProspek(data);
      const statusClass = status.includes("Personal") ? "status-personal" :
                          status.includes("Open") ? "status-open" : "status-exclusive";

      const tipe = Array.isArray(data.tipeTertarik) ? data.tipeTertarik.join(", ") : "-";
      const survey = data.tanggalSurvey ? ` - ${data.tanggalSurvey}` : "";

      const card = document.createElement("div");
      card.className = "prospek-card";
      card.innerHTML = `
        <div class="nama">${data.nama}</div>
        <div class="info">
          ${data.noTelp} - ${tipe}${survey}
        </div>
        <div class="status-line">
          <span class="status ${statusClass}">${status}</span>
          <span>${data.user}</span>
        </div>
      `;
      card.onclick = () => openDetail(docSnap.id, data);
      prospekList.appendChild(card);
    });
  });
}

// ... (fungsi getStatusProspek, openDetail, loadComments, event listeners tetap sama)
// Hitung Status Prospek Otomatis
function getStatusProspek(data) {
  const now = new Date();
  const created = data.createdAt?.toDate() || new Date();
  const monthsDiff = (now - created) / (1000 * 60 * 60 * 24 * 30);

  if (Array.isArray(data.progresPenjualan) && data.progresPenjualan.includes("Closing")) {
    return "Exclusive Lead";
  } else if (monthsDiff < 1) {
    return "Personal Lead";
  } else {
    return "Open Lead";
  }
}

// Buka Modal Detail
function openDetail(docId, data) {
  currentDocId = docId;
  detailContent.innerHTML = `
    <p><strong>No Telp:</strong> ${data.noTelp}</p>
    <p><strong>Asal Kota:</strong> ${data.asalKota || "-"}</p>
    <p><strong>Ketertarikan:</strong> ${data.ketertarikan || "-"}</p>
    <p><strong>Tipe Tertarik:</strong> ${Array.isArray(data.tipeTertarik) ? data.tipeTertarik.join(", ") : "-"}</p>
    <p><strong>Tanggal Survey:</strong> ${data.tanggalSurvey || "-"}</p>
    <p><strong>Catatan:</strong> ${data.catatan || "-"}</p>
    <p><strong>Status Penjualan:</strong> ${data.statusPenjualan || "-"}</p>
    <p><strong>Progres:</strong> ${Array.isArray(data.progresPenjualan) ? data.progresPenjualan.join(", ") : "-"}</p>
    <button class="btn btn-save" id="btnEdit">Edit Data</button>
  `;

  // Load komentar
  loadComments(docId);

  modal.style.display = "flex";
}

// Load komentar
function loadComments(docId) {
  commentsList.innerHTML = "";
  const docRef = doc(db, "prospek", docId);
  onSnapshot(docRef, (snap) => {
    commentsList.innerHTML = "";
    const comments = snap.data().comments || [];
    comments.forEach(c => {
      const div = document.createElement("div");
      div.className = "comment";
      const date = c.timestamp?.toDate()?.toLocaleString("id-ID") || "Baru saja";
      div.innerHTML = `
        <div class="comment-meta">${c.user} - ${date}</div>
        <div>${c.text}</div>
      `;
      commentsList.appendChild(div);
    });
  });
}

// Event Listeners
closeModal.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

document.getElementById("btnAddComment")?.addEventListener("click", async () => {
  const text = document.getElementById("newComment").value.trim();
  if (!text || !currentDocId) return;

  await updateDoc(doc(db, "prospek", currentDocId), {
    comments: arrayUnion({
      user: user,
      text: text,
      timestamp: serverTimestamp()
    })
  });
  document.getElementById("newComment").value = "";
});

// Search real-time
searchInput.addEventListener("input", (e) => {
  loadProspek(e.target.value);
});

// Init
loadProspek();
