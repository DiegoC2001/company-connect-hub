import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { createWebRTCManager, type WebRTCManager } from "@/hooks/useWebRTC";
import { registrarChamada, finalizarChamada } from "@/hooks/useCallRegistration";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface RemoteUserInfo {
  id: string;
  nome_completo: string;
  avatar_url: string | null;
  cargo: string | null;
  email: string;
}

export type CallStatus = "idle" | "calling" | "ringing" | "connected" | "ended";

interface CallState {
  status: CallStatus;
  callId: string | null;
  remoteUser: RemoteUserInfo | null;
  tipo: "voz" | "video";
  isMuted: boolean;
  isCameraOff: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  duration: number;
}

interface CallActions {
  startCall: (contato: RemoteUserInfo, tipo: "voz" | "video") => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  hangUp: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

type CallContextValue = CallState & CallActions;

const INITIAL: CallState = {
  status: "idle",
  callId: null,
  remoteUser: null,
  tipo: "voz",
  isMuted: false,
  isCameraOff: false,
  localStream: null,
  remoteStream: null,
  duration: 0,
};

const CALL_TIMEOUT_MS = 30_000;

const CallContext = createContext<CallContextValue | undefined>(undefined);

/* ------------------------------------------------------------------ */
/*  Incoming-call payload stored between "ringing" and "accept"        */
/* ------------------------------------------------------------------ */

interface PendingIncoming {
  callId: string;
  caller: RemoteUserInfo;
  tipo: "voz" | "video";
  offer: RTCSessionDescriptionInit;
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function CallProvider({ children }: { children: ReactNode }) {
  const { user, funcionario, empresaId } = useAuth();
  const [state, setState] = useState<CallState>(INITIAL);

  const rtcRef = useRef<WebRTCManager | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingRef = useRef<PendingIncoming | null>(null);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const durationRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const answerReceivedRef = useRef(false);

  /* ---- helpers --------------------------------------------------- */

  const reset = useCallback(() => {
    if (rtcRef.current) {
      rtcRef.current.close();
      rtcRef.current = null;
    }
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingRef.current = null;
    iceQueueRef.current = [];
    answerReceivedRef.current = false;
    setState(INITIAL);
  }, []);

  const broadcastOnCallChannel = useCallback(
    (event: string, payload: Record<string, unknown>) => {
      channelRef.current?.send({ type: "broadcast", event, payload });
    },
    [],
  );

  /* ---- subscribe to signaling channel for a given callId ---------- */

  const subscribeSignaling = useCallback(
    (callId: string, role: "caller" | "receiver") => {
      const ch = supabase.channel(`call:${callId}`, {
        config: { broadcast: { self: false } },
      });

      ch.on("broadcast", { event: "answer" }, ({ payload }) => {
        if (role !== "caller" || !rtcRef.current) return;
        answerReceivedRef.current = true;
        void rtcRef.current
          .setRemoteAnswer(payload.sdp as RTCSessionDescriptionInit)
          .then(() => {
            // flush queued ICE candidates from caller to receiver
            iceQueueRef.current.forEach((c) => {
              ch.send({ type: "broadcast", event: "ice", payload: { candidate: c } });
            });
            iceQueueRef.current = [];
          });
      });

      ch.on("broadcast", { event: "ice" }, ({ payload }) => {
        if (!rtcRef.current) return;
        void rtcRef.current.addIceCandidate(payload.candidate as RTCIceCandidateInit);
      });

      ch.on("broadcast", { event: "hangup" }, () => {
        const cid = state.callId ?? callId;
        const dur = state.duration;
        void finalizarChamada(cid, "completada", dur).catch(() => {});
        reset();
      });

      ch.on("broadcast", { event: "rejected" }, () => {
        const cid = state.callId ?? callId;
        void finalizarChamada(cid, "rejeitada", 0).catch(() => {});
        reset();
      });

      ch.subscribe();
      channelRef.current = ch;
    },
    [reset, state.callId, state.duration],
  );

  /* ---- listen for incoming calls --------------------------------- */

  useEffect(() => {
    if (!user) return;

    const incomingCh = supabase.channel(`incoming:${user.id}`, {
      config: { broadcast: { self: false } },
    });

    incomingCh.on("broadcast", { event: "call" }, ({ payload }) => {
      // Ignore if already in a call
      if (state.status !== "idle") return;

      const data = payload as {
        callId: string;
        caller: RemoteUserInfo;
        tipo: "voz" | "video";
        offer: RTCSessionDescriptionInit;
      };

      pendingRef.current = data;
      setState((prev) => ({
        ...prev,
        status: "ringing",
        callId: data.callId,
        remoteUser: data.caller,
        tipo: data.tipo,
      }));

      // Auto-reject after timeout
      timeoutRef.current = window.setTimeout(() => {
        if (pendingRef.current?.callId === data.callId) {
          void finalizarChamada(data.callId, "perdida", 0).catch(() => {});
          // Notify caller
          const tempCh = supabase.channel(`call:${data.callId}`, {
            config: { broadcast: { self: false } },
          });
          tempCh.subscribe(() => {
            tempCh.send({ type: "broadcast", event: "rejected", payload: {} });
            setTimeout(() => void supabase.removeChannel(tempCh), 1000);
          });
          reset();
        }
      }, CALL_TIMEOUT_MS);
    });

    incomingCh.subscribe();

    return () => {
      void supabase.removeChannel(incomingCh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, state.status]);

  /* ---- startCall (caller) ---------------------------------------- */

  const startCall = useCallback(
    async (contato: RemoteUserInfo, tipo: "voz" | "video") => {
      if (!user || !empresaId || !funcionario) return;

      setState((prev) => ({
        ...prev,
        status: "calling",
        remoteUser: contato,
        tipo,
      }));

      try {
        // 1. Register call in DB
        const record = await registrarChamada({
          remetente_id: user.id,
          destinatario_id: contato.id,
          empresa_id: empresaId,
        });
        const callId = record.id;
        setState((prev) => ({ ...prev, callId }));

        // 2. Create WebRTC manager
        const mgr = await createWebRTCManager(tipo, {
          onIceCandidate: (candidate) => {
            if (answerReceivedRef.current) {
              broadcastOnCallChannel("ice", { candidate });
            } else {
              iceQueueRef.current.push(candidate);
            }
          },
          onRemoteStream: (stream) => {
            setState((prev) => ({ ...prev, remoteStream: stream }));
          },
          onConnectionStateChange: (connState) => {
            if (connState === "connected") {
              setState((prev) => ({ ...prev, status: "connected" }));
              // Start duration timer
              durationRef.current = window.setInterval(() => {
                setState((prev) => ({ ...prev, duration: prev.duration + 1 }));
              }, 1000);
            }
            if (connState === "disconnected" || connState === "failed") {
              void finalizarChamada(callId, "completada", 0).catch(() => {});
              reset();
            }
          },
        });
        rtcRef.current = mgr;
        setState((prev) => ({ ...prev, localStream: mgr.localStream }));

        // 3. Subscribe to signaling channel
        subscribeSignaling(callId, "caller");

        // 4. Create offer
        const offer = await mgr.createOffer();

        // 5. Notify receiver via their incoming channel
        const notifyCh = supabase.channel(`incoming:${contato.id}`, {
          config: { broadcast: { self: false } },
        });
        notifyCh.subscribe(() => {
          notifyCh.send({
            type: "broadcast",
            event: "call",
            payload: {
              callId,
              caller: {
                id: user.id,
                nome_completo: funcionario.nome_completo,
                avatar_url: funcionario.avatar_url,
                cargo: funcionario.cargo,
                email: funcionario.email,
              } satisfies RemoteUserInfo,
              tipo,
              offer,
            },
          });
          // Remove after sending
          setTimeout(() => void supabase.removeChannel(notifyCh), 2000);
        });

        // 6. Timeout if not answered
        timeoutRef.current = window.setTimeout(() => {
          void finalizarChamada(callId, "perdida", 0).catch(() => {});
          reset();
        }, CALL_TIMEOUT_MS);
      } catch {
        reset();
      }
    },
    [user, empresaId, funcionario, reset, subscribeSignaling, broadcastOnCallChannel],
  );

  /* ---- acceptCall (receiver) ------------------------------------- */

  const acceptCall = useCallback(async () => {
    const pending = pendingRef.current;
    if (!pending) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      // 1. Create WebRTC manager
      const mgr = await createWebRTCManager(pending.tipo, {
        onIceCandidate: (candidate) => {
          broadcastOnCallChannel("ice", { candidate });
        },
        onRemoteStream: (stream) => {
          setState((prev) => ({ ...prev, remoteStream: stream }));
        },
        onConnectionStateChange: (connState) => {
          if (connState === "connected") {
            setState((prev) => ({ ...prev, status: "connected" }));
            durationRef.current = window.setInterval(() => {
              setState((prev) => ({ ...prev, duration: prev.duration + 1 }));
            }, 1000);
          }
          if (connState === "disconnected" || connState === "failed") {
            void finalizarChamada(pending.callId, "completada", 0).catch(() => {});
            reset();
          }
        },
      });
      rtcRef.current = mgr;
      setState((prev) => ({ ...prev, localStream: mgr.localStream }));

      // 2. Subscribe to signaling channel
      subscribeSignaling(pending.callId, "receiver");

      // 3. Create answer from stored offer
      const answer = await mgr.createAnswer(pending.offer);

      // 4. Send answer (small delay to ensure channel is ready)
      setTimeout(() => {
        broadcastOnCallChannel("answer", { sdp: answer });
      }, 300);
    } catch {
      reset();
    }
  }, [reset, subscribeSignaling, broadcastOnCallChannel]);

  /* ---- rejectCall (receiver) ------------------------------------- */

  const rejectCall = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;

    // Notify caller via a temporary channel
    const ch = supabase.channel(`call:${pending.callId}`, {
      config: { broadcast: { self: false } },
    });
    ch.subscribe(() => {
      ch.send({ type: "broadcast", event: "rejected", payload: {} });
      setTimeout(() => void supabase.removeChannel(ch), 1000);
    });

    void finalizarChamada(pending.callId, "rejeitada", 0).catch(() => {});
    reset();
  }, [reset]);

  /* ---- hangUp ---------------------------------------------------- */

  const hangUp = useCallback(() => {
    const callId = state.callId;
    const dur = state.duration;

    broadcastOnCallChannel("hangup", {});

    if (callId) {
      void finalizarChamada(callId, dur > 0 ? "completada" : "perdida", dur).catch(
        () => {},
      );
    }
    reset();
  }, [state.callId, state.duration, broadcastOnCallChannel, reset]);

  /* ---- toggleMute / toggleCamera --------------------------------- */

  const toggleMute = useCallback(() => {
    if (rtcRef.current) {
      const muted = rtcRef.current.toggleMute();
      setState((prev) => ({ ...prev, isMuted: muted }));
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (rtcRef.current) {
      const off = rtcRef.current.toggleCamera();
      setState((prev) => ({ ...prev, isCameraOff: off }));
    }
  }, []);

  /* ---- cleanup on unmount ---------------------------------------- */

  useEffect(() => {
    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- context value --------------------------------------------- */

  const value: CallContextValue = {
    ...state,
    startCall,
    acceptCall,
    rejectCall,
    hangUp,
    toggleMute,
    toggleCamera,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}