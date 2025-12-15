import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =====================
   STATE & KONFIG
===================== */
const user = localStorage.getItem("user")?.trim().toLowerCase();
if (!user) location.href = "index.html";

const isAdmin = user === "admin";

const list = document.getElementById("activityList");

const PAGE_SIZE = 10;
let lastVisible = null;
let isLoading = false;

// Guard anti-duplikat (WAJIB untuk mobile scroll)
const loadedIds = new Set();

/* =====================
   HELPER
===================== */
function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("id-ID");
}

/* =====================
   LOAD AKTIVITAS (FINAL)
===================== */
async function loadAktivitas() {
  if (isLoading) return;
  isLoading = true;

  if (!lastVisible) list.innerHTML = "";

  let q;

  if (isAdmin) {
    q = query(
      collection(db, "aktivitas"),
      orderBy("createdAt", "desc"),
      ...(lastVisible ? [startAfter(lastVisible)] : []),
      limit(PAGE_SIZE)
    );
  } else {
    q = query(
      collection(db, "aktivitas"),
      where("user", "==", user),
      orderBy("createdAt", "desc"),
      ...(lastVisible ? [startAfter(lastVisible)] : []),
      limit(PAGE_SIZE)
    );
  }

  const snap = await getDocs(q);

  // Kalau data habis → stop total
  if (snap.empty) {
    isLoading = true;
    return;
  }

  snap.forEach(docSnap => {
    // ⛔ Cegah render data yang sama
    if (loadedIds.has(docSnap.id)) return;
    loadedIds.add(docSnap.id);

    const d = docSnap.data();
    const el = document.createElement("div");
    el.className = "card";

    el.innerHTML = `
      <div class="row">
        <strong>${d.user || "-"}</strong>
        <span>${d.tipe || ""}</span>
      </div>
      <div class="text">${d.pesan || ""}</div>
      <div class="time">${formatDate(d.createdAt)}</div>
    `;

    // Klik hanya jika ada prospekId
    if (d.prospekId) {
      el.style.cursor = "pointer";
      el.onclick = () => {
        window.location.href =
          `list-prospek.html?open=${d.prospekId}`;
      };
    } else {
      el.style.opacity = "0.6";
      el.style.cursor = "default";
      el.title = "Aktivitas lama";
    }

    list.appendChild(el);
  });

  lastVisible = snap.docs[snap.docs.length - 1];
  isLoading = false;
}

/* =====================
   INIT
===================== */
loadAktivitas();

/* =====================
   SCROLL AUTO LOAD
===================== */
window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 200
  ) {
    loadAktivitas();
  }
});
