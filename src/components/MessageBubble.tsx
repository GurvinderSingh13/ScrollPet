import { useState } from 'react';
import { Play, Pause, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  userId: string;
  content: string;
  messageType: string;
  mediaUrl?: string | null;
  mediaDuration?: number | null;
  location: string;
  user: {
    id: string;
    displayName: string;
    state?: string;
    country?: string;
  };
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  displayName: string;
  onUserClick?: (userId: string, userName: string) => void;
}

export function MessageBubble({ message, isOwnMessage, displayName, onUserClick }: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudio = () => {
    if (!message.mediaUrl) return;

    if (!audioRef) {
      const audio = new Audio(message.mediaUrl);
      audio.onended = () => setIsPlaying(false);
      setAudioRef(audio);
      audio.play();
      setIsPlaying(true);
    } else if (isPlaying) {
      audioRef.pause();
      setIsPlaying(false);
    } else {
      audioRef.play();
      setIsPlaying(true);
    }
  };

  const renderContent = () => {
    switch (message.messageType) {
      case 'image':
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <img
                src={message.mediaUrl}
                alt="Shared image"
                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-h-60 object-contain"
                onClick={() => setShowFullImage(true)}
              />
            )}
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <video
                src={message.mediaUrl}
                controls
                className="max-w-full rounded-lg max-h-60"
              />
            )}
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center gap-3 min-w-[180px]">
            <button
              onClick={toggleAudio}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0",
                isOwnMessage
                  ? "bg-white/20 hover:bg-white/30"
                  : "bg-[#007699] text-white hover:bg-[#007699]/90"
              )}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className={cn(
                "h-1 rounded-full",
                isOwnMessage ? "bg-white/30" : "bg-gray-300"
              )}>
                <div className={cn(
                  "h-1 rounded-full w-0 transition-all",
                  isOwnMessage ? "bg-white" : "bg-[#007699]"
                )} />
              </div>
              <span className={cn(
                "text-xs mt-1 block",
                isOwnMessage ? "text-white/70" : "text-gray-500"
              )}>
                {message.mediaDuration ? formatDuration(message.mediaDuration) : '0:00'}
              </span>
            </div>
          </div>
        );

      default:
        return <p>{message.content}</p>;
    }
  };

  return (
    <>
      <div className={cn(
        "flex flex-col max-w-[85%] md:max-w-[70%]",
        isOwnMessage ? "ml-auto items-end" : "mr-auto items-start"
      )}>
        {!isOwnMessage && (
          <div className="text-xs text-gray-400 mb-1 ml-1 flex gap-1 items-center flex-wrap">
            <button
              onClick={() => onUserClick?.(message.user.id, message.user.displayName)}
              className={cn(
                "font-bold text-gray-600 hover:text-primary transition-colors",
                onUserClick ? "cursor-pointer hover:underline" : ""
              )}
            >
              @{message.user.displayName}
            </button>
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-500">[{message.location}]</span>
            {(message.user.state || message.user.country) && (
              <span className="bg-blue-50 px-1.5 py-0.5 rounded text-[10px] text-blue-600 border border-blue-100 font-medium">
                {[message.user.state, message.user.country].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        )}

        {/* WE WRAPPED THE MESSAGE BUBBLE IN THIS GROUP DIV */}
        <div className="group relative flex items-start gap-2">

          <div className={cn(
            "px-4 py-3 text-[15px] shadow-sm leading-relaxed",
            isOwnMessage
              ? "bg-[#007699] text-white rounded-2xl rounded-tr-sm"
              : "bg-[#F3F4F6] text-gray-800 rounded-2xl rounded-tl-sm",
            (message.messageType === 'image' || message.messageType === 'video') && "p-2"
          )}>
            {renderContent()}
          </div>

          {/* THE HOVER ICON AND MENU FOR OTHER USERS' MESSAGES */}
          {!isOwnMessage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 mt-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-full focus:opacity-100 outline-none">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-white shadow-md border rounded-md">
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-100 px-3 py-2 outline-none"
                  onClick={() => console.log('TODO: Reply to', message.user.displayName)}
                >
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-100 px-3 py-2 outline-none"
                  onClick={() => console.log('TODO: Private Message', message.user.displayName)}
                >
                  Private Message
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 hover:bg-red-50 focus:text-red-700 focus:bg-red-100 px-3 py-2 outline-none transition-colors"
                  onClick={() => console.log('TODO: Open Report Modal for', message.user.displayName)}
                >
                  Report User
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-100 px-3 py-2 outline-none"
                  onClick={() => console.log('TODO: Block', message.user.displayName)}
                >
                  Block
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

        </div>

        {isOwnMessage && (
          <div className="text-xs text-gray-400 mt-1 mr-1">
            @{displayName}
          </div>
        )}
      </div>

      {/* Full Image Modal */}
      {showFullImage && message.mediaUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setShowFullImage(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={message.mediaUrl}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}