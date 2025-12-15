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
import {
  doc,
  onSnapshot as onDocSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ⬇️ TAMBAHKAN STEP 1 DI SINI
let lastVisible = null;
let isLoading = false;
const PAGE_SIZE = 10;
// ⬆️ SAMPAI SINI

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


async function loadAktivitas() {
  if (isLoading) return;
  isLoading = true;

 if (!lastVisible) list.innerHTML = "";


  let q;

  if (isAdmin) {
    q = query(
      collection(db, "aktivitas"),
      orderBy("createdAt", "desc"),
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

  if (snap.empty) {
    list.innerHTML = `<div class="empty">Belum ada aktivitas</div>`;
    isLoading = false;
    return;
  }

  snap.forEach(docSnap => {
    const d = docSnap.data();

    const el = document.createElement("div");
    el.className = "card";

    el.innerHTML = `
      <div>${d.pesan}</div>
      <small>${d.user}</small>
    `;

    el.style.cursor = "pointer";
    el.onclick = () => {
      window.location.href =
        `list-prospek.html?open=${d.prospekId || ""}`;
    };

    list.appendChild(el);
  });

  lastVisible = snap.docs[snap.docs.length - 1];
  isLoading = false;
}
loadAktivitas();

window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 200
  ) {
    loadAktivitas();
  }
});
