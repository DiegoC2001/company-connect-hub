const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export interface WebRTCManager {
  pc: RTCPeerConnection;
  localStream: MediaStream;
  remoteStream: MediaStream;
  createOffer(): Promise<RTCSessionDescriptionInit>;
  createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
  setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void>;
  addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
  toggleMute(): boolean;
  toggleCamera(): boolean;
  close(): void;
}

export async function createWebRTCManager(
  tipo: "voz" | "video",
  callbacks: {
    onIceCandidate: (candidate: RTCIceCandidateInit) => void;
    onRemoteStream: (stream: MediaStream) => void;
    onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  },
): Promise<WebRTCManager> {
  const pc = new RTCPeerConnection(ICE_SERVERS);
  const remoteStream = new MediaStream();

  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: tipo === "video",
  });

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  pc.ontrack = (ev) => {
    ev.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
    callbacks.onRemoteStream(remoteStream);
  };

  pc.onicecandidate = (ev) => {
    if (ev.candidate) callbacks.onIceCandidate(ev.candidate.toJSON());
  };

  pc.onconnectionstatechange = () => {
    callbacks.onConnectionStateChange(pc.connectionState);
  };

  return {
    pc,
    localStream,
    remoteStream,

    async createOffer() {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      return pc.localDescription!.toJSON() as RTCSessionDescriptionInit;
    },

    async createAnswer(offer) {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      return pc.localDescription!.toJSON() as RTCSessionDescriptionInit;
    },

    async setRemoteAnswer(answer) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    },

    async addIceCandidate(candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore candidates that arrive before remote description is set
      }
    },

    toggleMute() {
      const t = localStream.getAudioTracks()[0];
      if (t) {
        t.enabled = !t.enabled;
        return !t.enabled;
      }
      return false;
    },

    toggleCamera() {
      const t = localStream.getVideoTracks()[0];
      if (t) {
        t.enabled = !t.enabled;
        return !t.enabled;
      }
      return true;
    },

    close() {
      localStream.getTracks().forEach((t) => t.stop());
      pc.close();
    },
  };
}