import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCEel7eAWrZcm_SoQUUK5sRdku3M_FWB6s",
  authDomain: "rentafriendchat.firebaseapp.com",
  databaseURL: "https://rentafriendchat-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rentafriendchat",
  storageBucket: "rentafriendchat.firebasestorage.app",
  messagingSenderId: "994392281737",
  appId: "1:994392281737:web:258c32ed98707be0baac58",
  measurementId: "G-F14P70RT0Q"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// 🔐 Auth Functions
window.signUp = function () {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, pass)
    .then(userCred => {
      document.getElementById("authStatus").innerText = "Signed up as " + userCred.user.email;
    })
    .catch(error => {
      document.getElementById("authStatus").innerText = error.message;
    });
};

window.login = function () {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, pass)
    .then(userCred => {
      document.getElementById("authStatus").innerText = "Logged in as " + userCred.user.email;
      document.getElementById("logoutBtn").style.display = "inline";
    })
    .catch(error => {
      document.getElementById("authStatus").innerText = error.message;
    });
};

window.logout = function () {
  signOut(auth).then(() => {
    document.getElementById("authStatus").innerText = "Logged out";
    document.getElementById("logoutBtn").style.display = "none";
  });
};

// Detect login status
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.querySelector(".chatbox").style.display = "block";
    document.getElementById("logoutBtn").style.display = "inline";
  } else {
    document.querySelector(".chatbox").style.display = "none";
    document.getElementById("logoutBtn").style.display = "none";
  }
});

// 💬 Chat Functions
window.sendMessage = function () {
  const msgBox = document.getElementById("msgInput");
  const message = msgBox.value.trim();

  if (message !== "") {
    const chatRef = ref(database, "chat");
    push(chatRef, {
      message: message,
      time: new Date().toLocaleTimeString()
    });
    msgBox.value = "";
  }
};

const chatRef = ref(database, "chat");
onChildAdded(chatRef, function (snapshot) {
  const data = snapshot.val();
  const div = document.createElement("div");
  div.textContent = `[${data.time}] ${data.message}`;
  document.getElementById("messages").appendChild(div);
});