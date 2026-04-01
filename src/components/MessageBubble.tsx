import { useState } from "react";
import { format } from "date-fns";
import { Play, Pause, X, ChevronDown, Loader2, Ban, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  userId: string;
  content: string;
  messageType: string;
  mediaUrl?: string | null;
  mediaDuration?: number | null;
  location: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    state?: string;
    country?: string;
    role?: string;
  };
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  displayName: string;
  currentUserRole?: string;
  onUserClick?: (userId: string, userName: string) => void;
  onReplyClick?: (userName: string) => void;
  onBanClick?: () => void;
  onDeleteClick?: (messageId: string) => void;
}

const REPORT_REASONS = [
  "Non-Pet-Related Discussion",
  "Using Language which is not allowed",
  "Abusive or harassing Language",
  "It's Spam",
  "Not belong to this Chat room",
  "Promoting competitor",
  "Unfair Negotiating Post",
];

export function MessageBubble({
  message,
  isOwnMessage,
  displayName,
  currentUserRole = "user",
  onUserClick,
  onReplyClick,
  onBanClick,
  onDeleteClick,
}: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const isModOrAbove = [
    "moderator",
    "super_moderator",
    "staff",
    "admin",
  ].includes(currentUserRole);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

  const handleReportUser = async (reason: string) => {
    setIsSubmittingReport(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("You must be logged in to report.");

      const { error } = await supabase.from("reports").insert({
        reporter_id: userData.user.id,
        reported_user_id: message.user.id,
        message_id: message.id,
        reason: reason,
      });

      if (error) throw error;
      toast({
        description:
          "Report submitted successfully. Our team will review this shortly.",
      });
      setIsReportModalOpen(false);
    } catch (err: any) {
      toast({
        description: err.message || "Failed to submit report.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const renderContent = () => {
    switch (message.messageType) {
      case "image":
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <img
                src={message.mediaUrl}
                alt="Shared"
                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 max-h-60 object-contain"
                onClick={() => setShowFullImage(true)}
              />
            )}
            {message.content && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
          </div>
        );
      case "video":
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <video
                src={message.mediaUrl}
                controls
                className="max-w-full rounded-lg max-h-60"
              />
            )}
            {message.content && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
          </div>
        );
      case "audio":
        return (
          <div className="flex items-center gap-3 min-w-[180px]">
            <button
              onClick={toggleAudio}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0",
                isOwnMessage
                  ? "bg-white/20 hover:bg-white/30"
                  : "bg-[#007699] text-white hover:bg-[#007699]/90",
              )}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <div className="flex-1">
              <div
                className={cn(
                  "h-1 rounded-full",
                  isOwnMessage ? "bg-white/30" : "bg-gray-300",
                )}
              >
                <div
                  className={cn(
                    "h-1 rounded-full w-0 transition-all",
                    isOwnMessage ? "bg-white" : "bg-[#007699]",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-xs mt-1 block",
                  isOwnMessage ? "text-white/70" : "text-gray-500",
                )}
              >
                {message.mediaDuration
                  ? formatDuration(message.mediaDuration)
                  : "0:00"}
              </span>
            </div>
          </div>
        );
      default:
        return <p className="whitespace-pre-wrap">{message.content}</p>;
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex flex-col max-w-[85%] md:max-w-[70%]",
          isOwnMessage ? "ml-auto items-end" : "mr-auto items-start",
        )}
      >
        {!isOwnMessage && (
          <div className="text-xs text-gray-400 mb-1 ml-1 flex gap-1 items-center flex-wrap">
            <button
              onClick={() =>
                onUserClick?.(message.user.id, message.user.displayName)
              }
              className={cn(
                "font-bold text-gray-600 hover:text-primary transition-colors",
                onUserClick ? "cursor-pointer hover:underline" : "",
              )}
            >
              @{message.user.displayName}
            </button>
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-500">
              [{message.location}]
            </span>
            {(message.user.state || message.user.country) && (
              <span className="bg-blue-50 px-1.5 py-0.5 rounded text-[10px] text-blue-600 border border-blue-100 font-medium">
                {[message.user.state, message.user.country]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            )}
          </div>
        )}

        <div className="group relative flex items-start gap-2">

          {/* Delete button for own messages (Fixed for mobile) */}
          {isOwnMessage && onDeleteClick && (
            <button
              onClick={() => onDeleteClick(message.id)}
              className="md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity p-2 mt-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 rounded-full focus:opacity-100 outline-none cursor-pointer"
              title="Unsend message"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div
            className={cn(
              "px-4 py-3 text-[15px] shadow-sm leading-relaxed",
              isOwnMessage
                ? "bg-[#007699] text-white rounded-2xl rounded-tr-sm"
                : "bg-[#F3F4F6] text-gray-800 rounded-2xl rounded-tl-sm",
              (message.messageType === "image" ||
                message.messageType === "video") &&
              "p-2",
            )}
          >
            {renderContent()}
            {message.createdAt && (
              <div className="text-[10px] opacity-60 text-right mt-1 -mb-1 flex justify-end">
                {format(new Date(message.createdAt), "h:mm a").toLowerCase()}
              </div>
            )}
          </div>

          {!isOwnMessage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* Dropdown Menu button for other's messages (Fixed for mobile) */}
                <button className="md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity p-2 mt-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-full focus:opacity-100 outline-none cursor-pointer">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-48 bg-white shadow-md border rounded-md"
              >
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-100 px-3 py-2"
                  onClick={() => onReplyClick?.(message.user.displayName)}
                >
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-100 px-3 py-2"
                  onClick={() =>
                    onUserClick?.(message.user.id, message.user.displayName)
                  }
                >
                  Private Message
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-100 px-3 py-2"
                  onClick={() => setIsReportModalOpen(true)}
                >
                  Report User
                </DropdownMenuItem>

                {/* Direct Ban/Delete option for Admins/Mods */}
                {isModOrAbove && (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer text-red-700 font-bold hover:bg-red-100 focus:bg-red-200 px-3 py-2 border-t border-red-100 mt-1"
                      onClick={() => onDeleteClick?.(message.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Message
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-red-700 font-bold hover:bg-red-100 focus:bg-red-200 px-3 py-2 mt-1"
                      onClick={onBanClick}
                    >
                      <Ban className="w-4 h-4 mr-2" /> Ban User
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

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

      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-white">
          <DialogHeader className="p-4 pb-2 border-b border-gray-100">
            <DialogTitle className="text-center text-xl font-bold">
              Report
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Why are you reporting this post?
            </h3>
            <div className="flex flex-col">
              {REPORT_REASONS.map((reason, index) => (
                <button
                  key={index}
                  onClick={() => handleReportUser(reason)}
                  disabled={isSubmittingReport}
                  className="text-left py-4 px-2 border-b border-gray-100 text-gray-700 hover:bg-gray-50 hover:text-red-600 disabled:opacity-50"
                >
                  {reason}
                </button>
              ))}
            </div>
            {isSubmittingReport && (
              <div className="flex justify-center items-center py-4 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting
                report...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}