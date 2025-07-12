// Import Firebase import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"; import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// Firebase config const firebaseConfig = { apiKey: "AIzaSyCEel7eAWrZcm_SoQUUK5sRdku3M_FWB6s", authDomain: "rentafriendchat.firebaseapp.com", databaseURL: "https://rentafriendchat-default-rtdb.asia-southeast1.firebasedatabase.app", projectId: "rentafriendchat", storageBucket: "rentafriendchat.appspot.com", messagingSenderId: "994392281737", appId: "1:994392281737:web:258c32ed98707be0baac58" };

const app = initializeApp(firebaseConfig); const db = getDatabase(app);

let chatRoom = ""; let currentUser = ""; let peerConnection; let localStream;

// ========== CHAT FUNCTIONS ========== //

window.startChat = function () { const username = document.getElementById("username").value.trim(); const friendname = document.getElementById("friendname").value.trim();

if (!username || !friendname) { alert("Enter both your name and your friend's name."); return; }

currentUser = username; chatRoom = [username, friendname].sort().join("_");

document.getElementById("loginSection").style.display = "none"; document.getElementById("chatSection").style.display = "block";

listenToChat(chatRoom); listenForCalls(); };

window.sendMessage = function () { const msgBox = document.getElementById("msgInput"); const message = msgBox.value.trim();

if (message !== "") { const chatRef = ref(db, "chats/" + chatRoom); push(chatRef, { user: currentUser, message: message, time: new Date().toLocaleTimeString() }); msgBox.value = ""; } };

function listenToChat(roomId) { const chatRef = ref(db, "chats/" + roomId); onChildAdded(chatRef, function (snapshot) { const data = snapshot.val(); const div = document.createElement("div"); div.textContent = [${data.time}] ${data.user}: ${data.message}; div.classList.add("message"); document.getElementById("messages").appendChild(div); }); }

// ========== CALL FUNCTIONS ========== //

window.startCall = async function () { try { localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); document.getElementById("localVideo").srcObject = localStream;

peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

localStream.getTracks().forEach(track => {
  peerConnection.addTrack(track, localStream);
});

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

const offer = await peerConnection.createOffer();

peerConnection.setLocalDescription(offer).then(() => {
  const callRef = ref(db, `calls/${chatRoom}`);
  push(callRef, {
    type: "offer",
    sdp: offer
  })
    .then(() => console.log("📡 Offer pushed to Firebase at /calls/" + chatRoom))
    .catch(err => console.error("❌ Failed to push offer:", err));
});

} catch (err) { console.error("🚫 Error starting call:", err); alert("Camera/mic access denied or not supported."); } };

function listenForCalls() { const signalRef = ref(db, calls/${chatRoom});

onChildAdded(signalRef, async snap => { const data = snap.val(); console.log("📩 Signal received:", data);

if (!peerConnection) {
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

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
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });
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
} else if (data.type === "candidate") {
  if (data.candidate) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (err) {
      console.error("ICE add error:", err);
    }
  }
}

}); }

// Optionally add auth functions if needed window.signUp = window.login = window.logout = function () { alert("Auth not implemented in this example."); };

