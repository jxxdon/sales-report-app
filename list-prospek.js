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
let currentData = null;

// Load daftar prospek
function loadProspek(searchTerm = "") {
  prospekBody.innerHTML = "";

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
    prospekBody.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (searchTerm && 
          !data.nama.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !data.noTelp.includes(searchTerm)) {
        return;
      }

      const progres = Array.isArray(data.progresPenjualan) ? data.progresPenjualan.join(", ") : "";
      const status = getStatusProspek(data);
      const statusClass = status.includes("Personal") ? "status-personal" :
                          status.includes("Open") ? "status-open" : "status-exclusive";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><strong>${data.nama}</strong></td>
        <td>${data.noTelp}</td>
        <td>${progres || "-"}</td>
        <td>${data.user}</td>
        <td><span class="${statusClass}">${status}</span></td>
      `;
      row.onclick = () => openDetail(docSnap.id, data);
      prospekBody.appendChild(row);
    });
  });
}

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
  currentData = data;

  renderDetailView(data);
  loadComments(docId);

  modal.style.display = "flex";
}

// Render tampilan detail (bukan edit)
function renderDetailView(data) {
  const progres = Array.isArray(data.progresPenjualan) ? data.progresPenjualan.join(", ") : "-";
  const tipeTertarik = Array.isArray(data.tipeTertarik) ? data.tipeTertarik.join(", ") : "-";

  detailContent.innerHTML = `
    <p><strong>Nama Prospek:</strong> ${data.nama}</p>
    <p><strong>No Telepon:</strong> ${data.noTelp}</p>
    <p><strong>Asal Kota:</strong> ${data.asalKota || "-"}</p>
    <p><strong>Ketertarikan:</strong> ${data.ketertarikan || "-"}</p>
    <p><strong>Tipe Tertarik:</strong> ${tipeTertarik}</p>
    <p><strong>Tanggal Survey:</strong> ${data.tanggalSurvey || "-"}</p>
    <p><strong>Catatan:</strong> ${data.catatan || "-"}</p>
    <p><strong>Status Penjualan:</strong> ${data.statusPenjualan || "-"}</p>
    <p><strong>Progres Penjualan:</strong> ${progres}</p>
    <p><strong>Dibuat oleh:</strong> ${data.user}</p>
    
    <div style="margin-top: 20px;">
      <button class="btn btn-save" id="btnEdit">Edit Data</button>
    </div>
  `;

  document.getElementById("btnEdit").onclick = () => renderEditForm(data);
}

// Render form edit
function renderEditForm(data) {
  const progres = Array.isArray(data.progresPenjualan) ? data.progresPenjualan : [];
  const tipeTertarik = Array.isArray(data.tipeTertarik) ? data.tipeTertarik : [];

  detailContent.innerHTML = `
    <div class="edit-field">
      <label><strong>Nama Prospek:</strong></label>
      <input type="text" id="editNama" value="${data.nama}">
    </div>
    <div class="edit-field">
      <label><strong>No Telepon:</strong></label>
      <input type="text" id="editNoTelp" value="${data.noTelp}">
    </div>
    <div class="edit-field">
      <label><strong>Asal Kota:</strong></label>
      <input type="text" id="editAsalKota" value="${data.asalKota || ''}">
    </div>
    <div class="edit-field">
      <label><strong>Ketertarikan:</strong></label>
      <input type="text" id="editKetertarikan" value="${data.ketertarikan || ''}">
    </div>
    <div class="edit-field">
      <label><strong>Tipe Tertarik:</strong></label>
      <input type="text" id="editTipeTertarik" value="${tipeTertarik.join(", ")}" placeholder="Pisahkan dengan koma">
    </div>
    <div class="edit-field">
      <label><strong>Tanggal Survey:</strong></label>
      <input type="date" id="editTanggalSurvey" value="${data.tanggalSurvey || ''}">
    </div>
    <div class="edit-field">
      <label><strong>Catatan:</strong></label>
      <textarea id="editCatatan" rows="3">${data.catatan || ''}</textarea>
    </div>
    <div class="edit-field">
      <label><strong>Status Penjualan:</strong></label>
      <input type="text" id="editStatusPenjualan" value="${data.statusPenjualan || ''}">
    </div>
    <div class="edit-field">
      <label><strong>Progres Penjualan:</strong></label>
      <input type="text" id="editProgres" value="${progres.join(", ")}" placeholder="Pisahkan dengan koma">
    </div>

    <div style="margin-top: 20px;">
      <button class="btn btn-save" id="btnSaveEdit">Simpan Perubahan</button>
      <button class="btn" id="btnCancelEdit" style="background:#6c757d;">Batal</button>
    </div>
  `;

  document.getElementById("btnSaveEdit").onclick = () => saveEdit();
  document.getElementById("btnCancelEdit").onclick = () => renderDetailView(currentData);
}

// Simpan perubahan edit
async function saveEdit() {
  const tipeTertarik = document.getElementById("editTipeTertarik").value.split(",").map(s => s.trim()).filter(s => s);
  const progres = document.getElementById("editProgres").value.split(",").map(s => s.trim()).filter(s => s);

  const updatedData = {
    nama: document.getElementById("editNama").value.trim(),
    noTelp: document.getElementById("editNoTelp").value.trim(),
    asalKota: document.getElementById("editAsalKota").value.trim(),
    ketertarikan: document.getElementById("editKetertarikan").value.trim(),
    tipeTertarik: tipeTertarik,
    tanggalSurvey: document.getElementById("editTanggalSurvey").value,
    catatan: document.getElementById("editCatatan").value.trim(),
    statusPenjualan: document.getElementById("editStatusPenjualan").value.trim(),
    progresPenjualan: progres
  };

  try {
    await updateDoc(doc(db, "prospek", currentDocId), updatedData);
    // Refresh data lokal
    currentData = { ...currentData, ...updatedData };
    renderDetailView(currentData);

    // Optional: tambah log otomatis
    await updateDoc(doc(db, "prospek", currentDocId), {
      comments: arrayUnion({
        user: user,
        text: "✏️ Data prospek diupdate",
        timestamp: serverTimestamp()
      })
    });
  } catch (error) {
    alert("Gagal menyimpan perubahan: " + error.message);
  }
}

// Load komentar
function loadComments(docId) {
  commentsList.innerHTML = "<p style='color:#666; text-align:center;'>Memuat komentar...</p>";
  const docRef = doc(db, "prospek", docId);
  onSnapshot(docRef, (snap) => {
    commentsList.innerHTML = "";
    const comments = snap.data().comments || [];
    if (comments.length === 0) {
      commentsList.innerHTML = "<p style='color:#999; text-align:center;'>Belum ada komentar</p>";
      return;
    }

    comments.forEach(c => {
      const div = document.createElement("div");
      div.className = "comment-item";
      const date = c.timestamp?.toDate()?.toLocaleString("id-ID") || "Baru saja";
      div.innerHTML = `
        <div class="comment-avatar">${c.user.charAt(0).toUpperCase()}</div>
        <div class="comment-bubble">
          <div class="comment-meta">${c.user} <span>• ${date}</span></div>
          <div class="comment-text">${c.text.replace(/\n/g, "<br>")}</div>
        </div>
      `;
      commentsList.appendChild(div);
    });
  });
}

// Event Listeners
closeModal.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

document.getElementById("btnAddComment")?.addEventListener("click", async () => {
  const textArea = document.getElementById("newComment");
  const text = textArea.value.trim();
  if (!text || !currentDocId) return;

  await updateDoc(doc(db, "prospek", currentDocId), {
    comments: arrayUnion({
      user: user,
      text: text,
      timestamp: serverTimestamp()
    })
  });
  textArea.value = "";
});

searchInput.addEventListener("input", (e) => {
  loadProspek(e.target.value.trim());
});

// Init
loadProspek();
