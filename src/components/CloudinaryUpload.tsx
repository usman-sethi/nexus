import React, { useState, useRef } from "react";
import { UploadCloud, FileIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface CloudinaryUploadProps {
  onUploadSuccess: (url: string) => void;
  label?: string;
  allowedTypes?: string; // e.g. "image/*,application/pdf"
}

export default function CloudinaryUpload({ 
  onUploadSuccess, 
  label = "Upload Showcase Asset or ID Card Document",
  allowedTypes = "image/*" 
}: CloudinaryUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unsigned Cloudinary Credentials provided by the user
  const CLOUD_NAME = "dciwfsc7i";
  const UPLOAD_PRESET = "paradox";

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setFileName(file.name);

    // Initial local preview
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    try {
      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      if (data.secure_url) {
        setPreviewUrl(data.secure_url);
        onUploadSuccess(data.secure_url);
      } else {
        throw new Error("Secure URL was not returned from upload node");
      }
    } catch (err: any) {
      console.error("[CLOUDINARY INDEX ERROR]", err);
      setError("Unsigned upload preset transaction failed. Check credentials.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="cloudinary-upload-wrapper" className="space-y-2 select-none">
      <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">{label}</label>
      
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all ${
          dragActive 
            ? "border-indigo-500 bg-indigo-50/40" 
            : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={allowedTypes}
          onChange={handleChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center space-y-2 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
            <span className="text-xs font-semibold text-slate-600">Uploading custom resource is pending...</span>
            <span className="text-[10px] font-mono text-slate-400">{fileName}</span>
          </div>
        ) : previewUrl ? (
          <div className="flex flex-col items-center space-y-3 py-1">
            <div className="relative aspect-video w-40 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
              <img src={previewUrl} alt="Upload Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              <CheckCircle2 className="h-4 w-4" /> Securely Hosted on Cloudinary
            </div>
            <span className="text-[9px] font-mono text-slate-500 max-w-[250px] truncate">{fileName || "Asset File Loaded"}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 py-3 text-center">
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
              <UploadCloud className="h-5 w-5 text-slate-500" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-800">Drag files here or tap to select</p>
              <p className="text-[10px] text-slate-500">Supports JPEG, PNG, vector images, and student verification files</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 p-2 bg-red-50 rounded-lg text-[10px] font-mono text-red-700 border border-red-100">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
