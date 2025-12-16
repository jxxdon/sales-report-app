import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const totalEl = document.getElementById("totalProspek");
const closingEl = document.getElementById("totalClosing");

onSnapshot(collection(db, "prospek"), snap => {
  let total = 0;
  let closing = 0;

  snap.forEach(doc => {
    total++;
    const comments = doc.data().comments || [];
    if (comments.length) {
      const last = comments[comments.length - 1];
      if (last.progress === "Closing") closing++;
    }
  });

  totalEl.textContent = total;
  closingEl.textContent = closing;
});
