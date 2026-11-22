import { useEffect, useRef, useState } from "react";

/** Imports PDF.js only after hydration; no browser PDF plug-in is required. */
export function PdfPreview({ url, title }: { url: string; title: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Loading PDF…");
  useEffect(() => {
    let cancelled = false;
    let dispose = () => {};
    setStatus("Loading PDF…");
    void (async () => {
      try {
        const [pdfjs, worker] = await Promise.all([
          import("pdfjs-dist"),
          import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
        ]);
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const task = pdfjs.getDocument({ url });
        dispose = () => { void task.destroy(); };
        const doc = await task.promise;
        const page = await doc.getPage(1);
        if (cancelled || !canvas.current) return;
        const viewport = page.getViewport({ scale: 1.5 });
        const element = canvas.current;
        element.width = viewport.width;
        element.height = viewport.height;
        await page.render({ canvas: element, viewport }).promise;
        if (!cancelled) setStatus("");
      } catch (error) {
        if (!cancelled) setStatus(error instanceof Error ? error.message : "PDF preview unavailable");
      }
    })();
    return () => { cancelled = true; dispose(); };
  }, [url]);
  return (
    <div className="min-w-0 overflow-hidden border bg-card">
      {status && <p role="status" className="p-3 text-sm text-muted-foreground">{status}</p>}
      <canvas ref={canvas} role="img" aria-label={title} className="h-auto w-full" />
    </div>
  );
}