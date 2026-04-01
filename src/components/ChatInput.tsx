import { useState, useRef, useEffect } from "react";
import {
  Smile,
  Image as ImageIcon,
  Mic,
  Send,
  X,
  Play,
  Pause,
  Square,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "./EmojiPicker";
import { Textarea } from "@/components/ui/textarea";

interface MediaPreview {
  file: File;
  url: string;
  type: "image" | "video";
}

interface AudioPreview {
  blob: Blob;
  url: string;
  duration: number;
}

interface ChatInputProps {
  onSendMessage: (
    content: string,
    type: "text" | "image" | "video" | "audio",
    file?: File,
    duration?: number,
  ) => Promise<boolean>;
  isConnected: boolean;
  initialValue?: string;
  onClearInitialValue?: () => void;
}

export function ChatInput({
  onSendMessage,
  isConnected,
  initialValue,
  onClearInitialValue,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (initialValue) {
      setMessage(initialValue);
      inputRef.current?.focus();
      onClearInitialValue?.();
    }
  }, [initialValue, onClearInitialValue]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [audioPreview, setAudioPreview] = useState<AudioPreview | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Reset textarea height when message is cleared
  useEffect(() => {
    if (message === "" && inputRef.current) {
      inputRef.current.style.height = "40px";
    }
  }, [message]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup audio player
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newValue);
      // Set cursor position after emoji
      setTimeout(() => {
        input.setSelectionRange(start + emoji.length, start + emoji.length);
        input.focus();
      }, 0);
    } else {
      setMessage((prev) => prev + emoji);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];

    if (
      !validImageTypes.includes(file.type) &&
      !validVideoTypes.includes(file.type)
    ) {
      alert(
        "Please select a valid image (JPG, PNG, GIF, WEBP) or video (MP4, WEBM, MOV) file.",
      );
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    const type = validImageTypes.includes(file.type) ? "image" : "video";

    setMediaPreview({ file, url, type });
    setAudioPreview(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeMediaPreview = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview.url);
      setMediaPreview(null);
    }
  };

  const removeAudioPreview = () => {
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview.url);
      setAudioPreview(null);
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioPreview({ blob: audioBlob, url, duration: recordingTime });

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioPreview) return;

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioPreview.url);
      audioPlayerRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSend = async () => {
    if (isUploading) return;

    // Determine what to send
    if (audioPreview) {
      setIsUploading(true);
      const success = await onSendMessage(
        message.trim(),
        "audio",
        audioPreview.blob,
        audioPreview.duration,
      );
      setIsUploading(false);
      if (success) {
        setMessage("");
        removeAudioPreview();
      }
    } else if (mediaPreview) {
      setIsUploading(true);
      const messageType = mediaPreview.type === "image" ? "image" : "video";
      const success = await onSendMessage(
        message.trim(),
        messageType,
        mediaPreview.file,
      );
      setIsUploading(false);
      if (success) {
        setMessage("");
        removeMediaPreview();
      }
    } else if (message.trim()) {
      const success = await onSendMessage(message.trim(), "text");
      if (success) {
        setMessage("");
      }
    }
  };

  const hasContent = message.trim() || mediaPreview || audioPreview;
  const showMic = !hasContent && !isRecording;

  return (
    <div className="p-4 bg-white border-t">
      {/* Media Preview */}
      {mediaPreview && (
        <div className="mb-3 relative inline-block">
          <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm max-w-xs">
            {mediaPreview.type === "image" ? (
              <img
                src={mediaPreview.url}
                alt="Preview"
                className="max-h-40 object-contain"
              />
            ) : (
              <video src={mediaPreview.url} className="max-h-40" controls />
            )}
          </div>
          <button
            onClick={removeMediaPreview}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Audio Preview */}
      {audioPreview && !isRecording && (
        <div className="mb-3 flex items-center gap-3 bg-gray-100 rounded-lg p-3 max-w-xs">
          <button
            onClick={toggleAudioPlayback}
            className="w-10 h-10 flex items-center justify-center bg-[#007699] text-white rounded-full hover:bg-[#007699]/90 transition-colors"
          >
            {isPlayingAudio ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
          <div className="flex-1">
            <div className="h-1 bg-gray-300 rounded-full">
              <div className="h-1 bg-[#007699] rounded-full w-0" />
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {formatTime(audioPreview.duration)}
            </span>
          </div>
          <button
            onClick={removeAudioPreview}
            className="p-1 text-gray-500 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mb-3 flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-3 max-w-xs">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-600 font-medium">
            Recording... {formatTime(recordingTime)}
          </span>
          <button
            onClick={stopRecording}
            className="ml-auto p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center gap-2 max-w-4xl mx-auto bg-white border rounded-full px-2 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#007699]/20 transition-all hover:border-gray-300">
        {/* Emoji Button */}
        <div className="relative shrink-0" ref={emojiPickerRef}>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors shrink-0"
            data-testid="button-emoji"
          >
            <Smile className="w-6 h-6" />
          </button>
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>

        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors shrink-0"
          data-testid="button-attachment"
        >
          <ImageIcon className="w-6 h-6" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text Input */}
        <Textarea
          ref={inputRef}
          rows={1}
          placeholder="Type a message..."
          className="flex-1 min-w-0 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-700 placeholder:text-gray-400 px-2 py-2 text-base resize-none overflow-y-auto min-h-[40px]"
          style={{ height: '40px', maxHeight: '120px' }}
          value={message}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setMessage(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (hasContent && !isUploading) {
                handleSend();
              }
            }
          }}
          disabled={isRecording || isUploading}
          data-testid="input-message"
        />

        {/* Send/Mic Button */}
        {isUploading ? (
          <div className="p-2.5 rounded-full bg-gray-100 shrink-0">
            <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : showMic ? (
          <button
            onClick={startRecording}
            className="p-2.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
            disabled={!isConnected}
            data-testid="button-mic"
          >
            <Mic className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            className="p-2.5 rounded-full bg-[#007699] text-white hover:bg-[#007699]/90 transition-all shadow-sm shrink-0"
            disabled={!isConnected || isUploading}
            data-testid="button-send"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}
