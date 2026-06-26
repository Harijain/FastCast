import { useState, type DragEvent } from "react";
import { UploadCloud, FileVideo, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/utils/format";

const ACCEPT = ["video/mp4", "video/quicktime", "video/x-matroska", "video/webm"];
const MAX_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

export function Dropzone({ file, onFile }: { file: File | null; onFile: (f: File | null) => void }) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (f: File) => { 
    if (!ACCEPT.includes(f.type) && !/\.(mp4|mov|mkv|webm)$/i.test(f.name)) return "Unsupported format. Use MP4, MOV, MKV or WebM.";
    if (f.size > MAX_BYTES) return "File exceeds 5 GB limit.";
    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const f = files[0];
    const err = validate(f);
    if (err) { setError(err); return; }
    setError(null);
    onFile(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handleFiles(e.dataTransfer.files);
  };

  if (file) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div className="rounded-md bg-primary/10 p-3 text-primary"><FileVideo className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-sm">{file.name}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{formatBytes(file.size)} · {file.type || "video"}</div>
          </div>
          <button onClick={() => onFile(null)} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground" aria-label="Remove">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition",
        drag ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]",
      )}
    >
      <input type="file" accept={ACCEPT.join(",")} className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
      <div className="mb-4 rounded-full bg-[image:var(--gradient-primary)] p-3 shadow-glow-primary">
        <UploadCloud className="h-6 w-6 text-white" />
      </div>
      <div className="text-base font-medium">Drop your video here, or click to browse</div>
      <div className="mt-1 text-sm text-muted-foreground">MP4, MOV, MKV, WebM · up to 5 GB</div>
      {error && <div className="mt-3 text-xs text-danger">{error}</div>}
    </label>
  );
}