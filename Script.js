// Import Firebase from CDN (v11 modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCEel7eAWrZcm_SoQUUK5sRdku3M_FWB6s",
  authDomain: "rentafriendchat.firebaseapp.com",
  databaseURL: "https://rentafriendchat-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rentafriendchat",
  storageBucket: "rentafriendchat.appspot.com",
  messagingSenderId: "994392281737",
  appId: "1:994392281737:web:258c32ed98707be0baac58"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Variables to track user and room
let chatRoom = "";
let currentUser = "";

// Called when user clicks "Start Chat"
window.startChat = function () {
  const username = document.getElementById("username").value.trim();
  const friendname = document.getElementById("friendname").value.trim();

  if (!username || !friendname) {
    alert("Enter both your name and your friend's name.");
    return;
  }

  currentUser = username;
  // Create room name (sorted so both users get same room)
  chatRoom = [username, friendname].sort().join("_");

  // Show chat section
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("chatSection").style.display = "block";

  // Start listening to chat messages
  listenToChat(chatRoom);
};

// Send a message
window.sendMessage = function () {
  const msgBox = document.getElementById("msgInput");
  const message = msgBox.value.trim();

  if (message !== "") {
    const chatRef = ref(database, "chats/" + chatRoom);
    push(chatRef, {
      user: currentUser,
      message: message,
      time: new Date().toLocaleTimeString()
    });
    msgBox.value = "";
  }
};

// Load messages from Firebase
function listenToChat(roomId) {
  const chatRef = ref(database, "chats/" + roomId);
  onChildAdded(chatRef, function (snapshot) {
    const data = snapshot.val();
    const div = document.createElement("div");
    div.textContent = `[${data.time}] ${data.user}: ${data.message}`;
    div.classList.add("message");
    document.getElementById("messages").appendChild(div);
  });
}