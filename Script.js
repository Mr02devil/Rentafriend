// Firebase v11 CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

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

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// 🔐 Auth Functions
window.signUp = function () {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, pass)
    .then(() => {
      document.getElementById("authStatus").innerText = "✅ Signed up!";
    })
    .catch(err => {
      document.getElementById("authStatus").innerText = `❌ ${err.message}`;
    });
};

window.login = function () {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, pass)
    .then(() => {
      document.getElementById("authStatus").innerText = "✅ Logged in!";
    })
    .catch(err => {
      document.getElementById("authStatus").innerText = `❌ ${err.message}`;
    });
};

window.logout = function () {
  signOut(auth).then(() => {
    document.getElementById("authStatus").innerText = "🚪 Logged out!";
  });
};

onAuthStateChanged(auth, user => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (user) {
    logoutBtn.style.display = "inline-block";
    document.getElementById("authStatus").innerText = `👋 Welcome, ${user.email}`;
  } else {
    logoutBtn.style.display = "none";
    document.getElementById("authStatus").innerText = "";
  }
});

// 💬 Chat
let chatRoom = "";
let currentUser = "";

window.startChat = function () {
  const uname = document.getElementById("username").value.trim();
  const fname = document.getElementById("friendname").value.trim();

  if (!uname || !fname) {
    alert("Enter both names.");
    return;
  }

  currentUser = uname;
  chatRoom = [uname, fname].sort().join("_");

  document.getElementById("loginSection").style.display = "none";
  document.getElementById("chatSection").style.display = "block";

  listenToChat(chatRoom);
};

window.sendMessage = function () {
  const msg = document.getElementById("msgInput").value.trim();
  if (!msg) return;

  const chatRef = ref(db, "chats/" + chatRoom);
  push(chatRef, {
    user: currentUser,
    message: msg,
    time: new Date().toLocaleTimeString()
  });

  document.getElementById("msgInput").value = "";
};

function listenToChat(roomId) {
  const chatRef = ref(db, "chats/" + roomId);
  onChildAdded(chatRef, snap => {
    const data = snap.val();
    const div = document.createElement("div");
    div.className = "message";
    div.textContent = `[${data.time}] ${data.user}: ${data.message}`;
    document.getElementById("messages").appendChild(div);
    document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
  });

  listenForCalls(); // 📞 Enable call listener
}

// 📞 Video Call — WebRTC
let peerConnection;
let localStream;
const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

window.startCall = async function () {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById("localVideo").srcObject = localStream;

  peerConnection = new RTCPeerConnection(servers);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = e => {
    document.getElementById("remoteVideo").srcObject = e.streams[0];
  };

  peerConnection.onicecandidate = e => {
    if (e.candidate) {
      push(ref(db, `calls/${chatRoom}/ice`), {
        type: "candidate",
        candidate: e.candidate.toJSON()
      });
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  push(ref(db, `calls/${chatRoom}`), {
    type: "offer",
    sdp: offer
  });
};

window.endCall = function () {
  if (peerConnection) peerConnection.close();
  if (localStream) localStream.getTracks().forEach(t => t.stop());

  document.getElementById("localVideo").srcObject = null;
  document.getElementById("remoteVideo").srcObject = null;
};

// 📡 Listen for incoming calls
function listenForCalls() {
  const signalRef = ref(db, `calls/${chatRoom}`);
  onChildAdded(signalRef, async snap => {
    const data = snap.val();

    if (!peerConnection) {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      document.getElementById("localVideo").srcObject = localStream;

      peerConnection = new RTCPeerConnection(servers);
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

      peerConnection.ontrack = e => {
        document.getElementById("remoteVideo").srcObject = e.streams[0];
      };

      peerConnection.onicecandidate = e => {
        if (e.candidate) {
          push(ref(db, `calls/${chatRoom}/ice`), {
            type: "candidate",
            candidate: e.candidate.toJSON()
          });
        }
      };
    }

    if (data.type === "offer") {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      push(ref(db, `calls/${chatRoom}`), {
        type: "answer",
        sdp: answer
      });
    }

    if (data.type === "answer") {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    }

    if (data.type === "candidate") {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (e) {
        console.warn("ICE add error:", e);
      }
    }
  });
}