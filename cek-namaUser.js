import { db } from "./firebase.js";
import { collection, getDocs } from
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

async function cekNamaUser() {
  const snap = await getDocs(collection(db, "prospek"));

  const map = {};
  let total = 0;

  snap.forEach(docSnap => {
    const d = docSnap.data();
    if (!d.namaUser) return;

    total++;

    const raw = d.namaUser;
    const normalized = raw.trim().toLowerCase();

    if (!map[normalized]) {
      map[normalized] = new Set();
    }
    map[normalized].add(raw);
  });

  console.log("=== HASIL CEK namaUser ===");
  console.log("Total prospek dengan namaUser:", total);

  Object.keys(map).forEach(key => {
    const variants = Array.from(map[key]);
    if (variants.length > 1) {
      console.warn(`⚠️ ${key}:`, variants);
    } else {
      console.log(`✅ ${key}:`, variants[0]);
    }
  });

  console.log("=== SELESAI ===");
}

cekNamaUser();
