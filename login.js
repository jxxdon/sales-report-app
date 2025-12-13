const users = {
  admin: "ramenuno20",
  sales1: "kucinggemoy23",
  sales2: "pandalucu88",
  sales3: "beruangmini45",
  sales4: "bantengimut12",
  sales5: "hamsterngakak87"
};

function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  if (users[user] === pass) {
    localStorage.setItem("user", user);
    window.location.href = "dashboard.html";
  } else {
    alert("Username atau password salah");
  }
}
