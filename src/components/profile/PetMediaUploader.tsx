import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, X, ImageIcon, VideoIcon } from "lucide-react";

interface PetMediaUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  petId: string;
  onSuccess?: () => void;
}

export function PetMediaUploader({ isOpen, onClose, petId, onSuccess }: PetMediaUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "Please select a file", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `pet-gallery/${petId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-uploads')
        .getPublicUrl(filePath);

      const isVideo = file.type.startsWith('video/');

      const { error: dbError } = await supabase.from('pet_media').insert({
        pet_id: petId,
        media_url: publicUrl,
        media_type: isVideo ? 'video' : 'image',
        caption: "",
      });

      if (dbError) throw dbError;

      toast({ title: "Media uploaded successfully!" });
      setFile(null);
      setPreviewUrl(null);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl border-0 shadow-xl overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-bold text-gray-900">Upload to Gallery</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 text-[#007699]">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Click to upload media</p>
              <p className="text-xs text-gray-500 mt-1">Images and videos are supported</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center">
              {file.type.startsWith('video/') ? (
                <video src={previewUrl!} className="w-full h-full object-contain" controls />
              ) : (
                <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" />
              )}
              <button 
                onClick={() => { setFile(null); setPreviewUrl(null); }}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="hidden"
          />

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl border-gray-200">
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || isSubmitting}
              className="rounded-xl bg-[#007699] hover:bg-[#005a75] text-white px-6 shadow-md"
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
