import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const grid = document.getElementById("resumeGrid");

onSnapshot(collection(db, "prospek"), snap => {
  const data = snap.docs.map(d => d.data());

  const map = {};

  data.forEach(p => {
    const s = p.namaUser;
    if (!s || s === "admin") return;

    map[s] ??= {
      prospekBaru:0,
      prospekAktif:0,
      survey:0,
      booking:0,
      point:0
    };

    map[s].prospekBaru++;

    if (p.status === "Aktif") map[s].prospekAktif++;

    const c = p.comments || [];
    c.forEach(x => {
      if (x.progress === "Survey") map[s].survey++;
      if (x.progress === "Booking") map[s].booking++;
    });
  });

  // contoh hitung point (SAMAKAN dgn rumus kamu)
  Object.values(map).forEach(v => {
    v.point =
      v.prospekBaru * 0.2 +
      v.survey * 2 +
      v.booking * 15;
  });

  render(map);
});

function render(map) {
  grid.innerHTML = "";

  Object.keys(map).sort().forEach(s => {
    const v = map[s];
    grid.innerHTML += `
      <div class="card">
        <div class="name">${s}</div>
        <div class="point">Point : ${Math.round(v.point)}</div>

        <div class="line">${v.prospekBaru} Prospek Baru</div>
        <div class="line">${v.prospekAktif} Prospek Aktif</div>
        <div class="line">${v.survey}x Survey</div>
        <div class="line">${v.booking} Booking</div>
      </div>
    `;
  });
}

