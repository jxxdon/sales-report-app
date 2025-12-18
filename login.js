import { signInWithEmailAndPassword } 
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { auth } from "./firebase.js";

window.login = function () {
  const email = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      alert("Login gagal: " + error.message);
    });
};
