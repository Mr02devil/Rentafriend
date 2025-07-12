// Firebase Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// Firebase Config
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
const db = getDatabase(app);

let chatRoom = "";
let currentUser = "";
let peerConnection;
let localStream;

// Start Chat
window.startChat = function () {
  const username = document.getElementById("username").value.trim();
  const friendname = document.getElementById("friendname").value.trim();

  if (!username || !friendname) {
    alert("Please enter both names.");
    return;
  }

  currentUser = username;
  chatRoom = [username, friendname].sort().join("_");

  document.getElementById("loginSection").style.display = "none";
  document.getElementById("chatSection").style.display = "block";

  listenToChat(chatRoom);
  listenForCalls();
};

// Send Message
window.sendMessage = function () {
  const msgBox = document.getElementById("msgInput");
  const message = msgBox.value.trim();

  if (message !== "") {
    const chatRef = ref(db, "chats/" + chatRoom);
    push(chatRef, {
      user: currentUser,
      message: message,
      time: new Date().toLocaleTimeString()
    });
    msgBox.value = "";
  }
};

// Listen to Chat
function listenToChat(roomId) {
  const chatRef = ref(db, "chats/" + roomId);
  onChildAdded(chatRef, function (snapshot) {
    const data = snapshot.val();
    const div = document.createElement("div");
    div.textContent = `[${data.time}] ${data.user}: ${data.message}`;
    div.classList.add("message");
    document.getElementById("messages").appendChild(div);
  });
}

// Start Video Call
window.startCall = async function () {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById("localVideo").srcObject = localStream;

    peerConnection = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

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

  } catch (err) {
    alert("Camera or microphone access denied.");
    console.error(err);
  }
};

// Listen for Calls
function listenForCalls() {
  const signalRef = ref(db, `calls/${chatRoom}`);
  onChildAdded(signalRef, async snap => {
    const data = snap.val();

    if (!peerConnection) {
      peerConnection = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

      peerConnection.ontrack = event => {
        document.getElementById("remoteVideo").srcObject = event.streams[0];
      };

      peerConnection.onicecandidate = e => {
        if (e.candidate) {
          push(ref(db, `calls/${chatRoom}/ice`), {
            type: "candidate",
            candidate: e.candidate.toJSON()
          });
        }
      };

      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
      document.getElementById("localVideo").srcObject = localStream;
    }

    if (data.type === "offer") {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      push(ref(db, `calls/${chatRoom}`), {
        type: "answer",
        sdp: answer
      });

    } else if (data.type === "answer") {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } else if (data.type === "candidate" && data.candidate) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error("ICE error:", err);
      }
    }
  });
}

// Auth placeholders
window.signUp = window.login = window.logout = function () {
  alert("Firebase Auth not implemented in this version.");
};