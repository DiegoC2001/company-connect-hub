import { useState, useEffect } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RoomChat } from "./RoomChat";
import { useAuth } from "@/contexts/AuthContext";
import { type SalaComCriador } from "@/hooks/useSalas";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sala: SalaComCriador | null;
}

export function MeetingRoomDialog({ open, onOpenChange, sala }: Props) {
  const { user, empresaId } = useAuth();
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(true);

  if (!sala || !user || !empresaId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen p-0 gap-0 border-none rounded-none flex flex-col bg-zinc-950 text-white overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm leading-none">{sala.nome_sala}</h2>
              <p className="text-[10px] text-zinc-400 mt-1">Reunião em andamento</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <Button 
              variant="ghost" 
              size="sm" 
              className={cn("text-xs gap-2", showChat && "bg-zinc-800")}
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content (Video Grid) */}
          <div className="flex-1 p-6 flex items-center justify-center bg-zinc-950">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl h-full items-center">
              {/* My Video */}
              <div className="relative aspect-video bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden group">
                {videoOn ? (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 italic">
                    [Seu Vídeo]
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] flex items-center gap-2">
                  Você {!micOn && <MicOff className="h-3 w-3 text-destructive" />}
                </div>
              </div>

              {/* Other participants (Mock) */}
              <div className="relative aspect-video bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                  ?
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px]">
                  Aguardando outros participantes...
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Chat */}
          {showChat && (
            <div className="w-80 border-l border-zinc-800 bg-zinc-900">
              <RoomChat 
                salaId={sala.id} 
                userId={user.id} 
                empresaId={empresaId} 
                onClose={() => setShowChat(false)} 
              />
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="h-20 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800 flex items-center justify-center gap-4">
          <Button
            variant={micOn ? "secondary" : "destructive"}
            size="icon"
            className="rounded-full h-12 w-12"
            onClick={() => setMicOn(!micOn)}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          <Button
            variant={videoOn ? "secondary" : "destructive"}
            size="icon"
            className="rounded-full h-12 w-12"
            onClick={() => setVideoOn(!videoOn)}
          >
            {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full h-12 w-12 ml-4"
            onClick={() => onOpenChange(false)}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
