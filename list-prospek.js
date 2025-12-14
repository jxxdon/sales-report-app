import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================
   USER
===================== */
const user = localStorage.getItem("user")?.toLowerCase();
if (!user) window.location.href = "index.html";
const isAdmin = user === "admin";

/* =====================
   ELEMENT
===================== */
const prospekList = document.getElementById("prospekList");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("detailModal");
const closeModal = document.querySelector(".close");
const detailContent = document.getElementById("detailContent");

/* =====================
   HELPER
===================== */
const cleanPhone = (v) => (v || "").replace(/\D/g, "");

function getStatusProspek(createdAt) {
  if (!createdAt) return "Personal Lead";

  const created = createdAt.toDate();
  const diffHari =
    (new Date() - created) / (1000 * 60 * 60 * 24);

  return diffHari < 30 ? "Personal Lead" : "Open Lead";
}

/* =====================
   LOAD DATA
===================== */
function loadProspek(keyword = "") {
  prospekList.innerHTML =
    "<p style='text-align:center;color:#999;padding:40px'>Memuat data...</p>";

  const q = isAdmin
    ? query(collection(db, "prospek"), orderBy("createdAt", "desc"))
    : query(
        collection(db, "prospek"),
        where("user", "==", user),
        orderBy("createdAt", "desc")
      );

  const search = keyword.toLowerCase();
  const phoneSearch = cleanPhone(keyword);

  onSnapshot(q, (snap) => {
    prospekList.innerHTML = "";

    if (snap.empty) {
      prospekList.innerHTML =
        "<p style='text-align:center;color:#999'>Tidak ada prospek</p>";
      return;
    }

    let ada = false;

    snap.forEach((docSnap) => {
      const d = docSnap.data();

      if (search) {
        const namaMatch = d.nama?.toLowerCase().includes(search);
        const telpMatch = cleanPhone(d.noTelp).includes(phoneSearch);
        if (!namaMatch && !telpMatch) return;
      }

      ada = true;

      const status = getStatusProspek(d.createdAt);
      const statusClass =
        status === "Personal Lead"
          ? "status-personal"
          : "status-open";

      const tipe =
        Array.isArray(d.tipeTertarik)
          ? d.tipeTertarik.join(", ")
          : "-";

      const card = document.createElement("div");
      card.className = "prospek-card";

      card.innerHTML = `
        <div class="nama">${d.nama || "-"}</div>
        <div class="info">
          ${d.noTelp || "-"} - ${d.asalKota || "-"} - ${d.asalProspek || "-"} - ${tipe}
        </div>
        <div class="status-line">
          <span class="status ${statusClass}">${status}</span>
        </div>
        <div class="info" style="margin-top:6px;color:#666">
          👤 ${d.user || "-"}
        </div>
      `;

      card.onclick = () => openCatatan(d.catatan);
      prospekList.appendChild(card);
    });

    if (!ada) {
      prospekList.innerHTML =
        "<p style='text-align:center;color:#999'>Tidak ada hasil</p>";
    }
  });
}

/* =====================
   MODAL CATATAN
===================== */
function openCatatan(catatan) {
  detailContent.innerHTML = `
    <div style="white-space:pre-wrap;line-height:1.6">
      ${catatan || "Tidak ada catatan"}
    </div>
  `;
  modal.style.display = "flex";
}

/* =====================
   EVENT
===================== */
closeModal.onclick = () => (modal.style.display = "none");
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

searchInput.addEventListener("input", (e) => {
  clearTimeout(window._delay);
  window._delay = setTimeout(
    () => loadProspek(e.target.value),
    300
  );
});

/* =====================
   INIT
===================== */
loadProspek();
