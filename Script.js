import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Firebase Config
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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Global variables
let chatRoom = "";

// Authentication Functions
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

// Detect if user is logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("chatSection").style.display = "none";
    document.getElementById("logoutBtn").style.display = "inline";
    document.getElementById("authStatus").innerText = "Logged in as " + user.email;
  } else {
    document.getElementById("chatSection").style.display = "none";
    document.getElementById("logoutBtn").style.display = "none";
  }
});

// Start Chat
window.startChat = function () {
  const user = document.getElementById("username").value.trim().toLowerCase();
  const friend = document.getElementById("friendname").value.trim().toLowerCase();

  if (user === "" || friend === "") {
    alert("Please enter both names");
    return;
  }

  chatRoom = [user, friend].sort().join("_");

  document.getElementById("chatSection").style.display = "block";
  document.getElementById("loginSection").style.display = "none";

  const messagesRef = ref(db, "chats/" + chatRoom);
  onChildAdded(messagesRef, function (snapshot) {
    const data = snapshot.val();
    const div = document.createElement("div");
    div.className = "message";
    div.textContent = `[${data.time}] ${data.sender}: ${data.message}`;
    document.getElementById("messages").appendChild(div);
    document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
  });
};

// Send Message
window.sendMessage = function () {
  const message = document.getElementById("msgInput").value.trim();
  const sender = document.getElementById("username").value.trim();

  if (message === "") return;

  const chatRef = ref(db, "chats/" + chatRoom);
  push(chatRef, {
    sender: sender,
    message: message,
    time: new Date().toLocaleTimeString()
  });

  document.getElementById("msgInput").value = "";
};