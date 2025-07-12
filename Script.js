window.startCall = async function () {
  try {
    // 1. Get camera & mic
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById("localVideo").srcObject = localStream;

    // 2. Create PeerConnection
    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    // 3. Add media tracks to peer connection
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // 4. Handle remote stream
    peerConnection.ontrack = event => {
      console.log("📹 Remote stream received");
      document.getElementById("remoteVideo").srcObject = event.streams[0];
    };

    // 5. Handle ICE candidates
    peerConnection.onicecandidate = e => {
      if (e.candidate) {
        console.log("❄️ Sending ICE candidate");
        push(ref(db, `calls/${chatRoom}/ice`), {
          type: "candidate",
          candidate: e.candidate.toJSON()
        });
      }
    };

    // 6. Create Offer
    const offer = await peerConnection.createOffer();

    // 7. Set local description, then push offer to Firebase
    peerConnection.setLocalDescription(offer).then(() => {
      const callRef = ref(db, `calls/${chatRoom}`);
      push(callRef, {
        type: "offer",
        sdp: offer
      })
        .then(() => {
          console.log("📡 Offer pushed to Firebase at /calls/" + chatRoom);
        })
        .catch(err => {
          console.error("❌ Failed to push offer:", err);
        });
    });

  } catch (err) {
    console.error("🚫 Error starting call:", err);
    alert("Camera/mic access denied or not supported.");
  }
};