// Firebase Imports (v11)
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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentUser = "";
let chatRoom = "";
let localStream;
let peerConnection;

// Chat setup
window.startChat = function () {
  const username = document.getElementById("username").value.trim();
  const friendname = document.getElementById("friendname").value.trim();
  if (!username || !friendname) return alert("Enter both names!");

  currentUser = username;
  chatRoom = [username, friendname].sort().join("_");

  document.getElementById("loginSection").style.display = "none";
  document.getElementById("chatSection").style.display = "block";

  listenToChat();
  listenForCalls();
};

// Send a message
window.sendMessage = function () {
  const msgInput = document.getElementById("msgInput");
  const message = msgInput.value.trim();
  if (message === "") return;
  push(ref(db, "chats/" + chatRoom), {
    user: currentUser,
    message,
    time: new Date().toLocaleTimeString()
  });
  msgInput.value = "";
};

// Load messages
function listenToChat() {
  const chatRef = ref(db, "chats/" + chatRoom);
  onChildAdded(chatRef, snap => {
    const data = snap.val();
    const div = document.createElement("div");
    div.textContent = `[${data.time}] ${data.user}: ${data.message}`;
    div.classList.add("message");
    document.getElementById("messages").appendChild(div);
  });
}

// Start Call
window.startCall = async function () {
  await initPeer();

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  push(ref(db, `calls/${chatRoom}`), {
    type: "offer",
    sdp: offer
  });

  console.log("📡 Offer sent.");
};

// Init peer connection
async function initPeer() {
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById("localVideo").srcObject = localStream;

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = event => {
    console.log("🎥 Remote stream received.");
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = e => {
    if (e.candidate) {
      push(ref(db, `calls/${chatRoom}`), {
        type: "candidate",
        candidate: e.candidate.toJSON()
      });
    }
  };
}

// Handle all signaling
function listenForCalls() {
  const signalRef = ref(db, `calls/${chatRoom}`);
  onChildAdded(signalRef, async snap => {
    const data = snap.val();
    if (!peerConnection && data.type !== "offer") return;

    console.log("📩 Signal:", data.type);

    if (!peerConnection) await initPeer();

    if (data.type === "offer") {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      push(ref(db, `calls/${chatRoom}`), {
        type: "answer",
        sdp: answer
      });

      console.log("📨 Answer sent.");
    } else if (data.type === "answer") {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      console.log("✅ Answer received.");
    } else if (data.type === "candidate") {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log("🧊 ICE added.");
      } catch (e) {
        console.warn("ICE Error", e);
      }
    }
  });
}