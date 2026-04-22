import { useEffect, useRef } from "react";
import { Camera, CameraOff, Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCall } from "@/contexts/CallContext";

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

const formatTimer = (s: number) => {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export function ActiveCallOverlay() {
  const {
    status,
    remoteUser,
    tipo,
    isMuted,
    isCameraOff,
    localStream,
    remoteStream,
    duration,
    hangUp,
    toggleMute,
    toggleCamera,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (status !== "calling" && status !== "connected") return null;
  if (!remoteUser) return null;

  const isVideo = tipo === "video";
  const isConnected = status === "connected";

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-gray-950 text-white">
      {/* Background / Video area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* Remote video (full background) */}
        {isVideo && isConnected ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          /* Voice call or connecting: show avatar */
          <div className="flex flex-col items-center gap-6">
            <Avatar className="h-32 w-32 ring-4 ring-white/20">
              {remoteUser.avatar_url && (
                <AvatarImage src={remoteUser.avatar_url} alt={remoteUser.nome_completo} />
              )}
              <AvatarFallback className="bg-primary text-4xl text-primary-foreground">
                {iniciais(remoteUser.nome_completo)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-2xl font-semibold">{remoteUser.nome_completo}</h2>
              <p className="mt-1 text-sm text-white/60">
                {remoteUser.cargo ?? remoteUser.email}
              </p>
            </div>
            {!isConnected && (
              <div className="flex items-center gap-2 text-white/70">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                Chamando...
              </div>
            )}
          </div>
        )}

        {/* Local video PIP (top right) */}
        {isVideo && localStream && (
          <div className="absolute right-4 top-4 h-40 w-28 overflow-hidden rounded-xl border-2 border-white/30 shadow-lg sm:h-48 sm:w-36">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {isCameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <CameraOff className="h-6 w-6 text-white/50" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      {isConnected && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-white/80">
          <Phone className="h-3.5 w-3.5 text-green-400" />
          <span className="font-mono">{formatTimer(duration)}</span>
        </div>
      )}

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-4 bg-gray-900/80 px-6 py-5 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className={`h-14 w-14 rounded-full ${isMuted ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white hover:bg-white/20"}`}
          onClick={toggleMute}
          disabled={!isConnected}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>

        {isVideo && (
          <Button
            variant="ghost"
            size="icon"
            className={`h-14 w-14 rounded-full ${isCameraOff ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white hover:bg-white/20"}`}
            onClick={toggleCamera}
            disabled={!isConnected}
          >
            {isCameraOff ? (
              <CameraOff className="h-6 w-6" />
            ) : (
              <Camera className="h-6 w-6" />
            )}
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-full bg-red-600 text-white hover:bg-red-700"
          onClick={hangUp}
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}