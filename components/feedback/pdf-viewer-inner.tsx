"use client";

import { useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, AlertCircle, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { annotationStyle } from "@/services/feedback/constants";
import type { Annotation } from "@/services/feedback/types";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface Props {
  fileUrl: string;
  annotations: Annotation[];
  activeAnnotation: string | null;
  onAnnotationClick: (id: string | null) => void;
  onPageRefsReady: (refs: Map<number, HTMLDivElement>) => void;
}

export default function PdfViewerInner({ fileUrl, annotations, activeAnnotation, onAnnotationClick, onPageRefsReady }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  function handleLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    onPageRefsReady(pageRefs.current);
  }

  function zoom(delta: number) {
    setScale((s) => Math.min(2, Math.max(0.5, Math.round((s + delta) * 10) / 10)));
  }

  return (
    <>
      <div className="flex items-center px-3 py-2 border-b bg-muted/60 gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto cursor-pointer" onClick={() => zoom(-0.1)} disabled={scale <= 0.5}>
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums w-10 text-center">{Math.round(scale * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => zoom(0.1)} disabled={scale >= 2}>
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="overflow-auto" style={{ maxHeight: "75vh" }}>
        <Document file={fileUrl} onLoadSuccess={handleLoadSuccess} loading={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          } error={
            <div className="flex items-center justify-center py-12 text-sm text-destructive gap-2">
              <AlertCircle className="w-4 h-4" /> Failed to load PDF.
            </div>
          }>
          {Array.from({ length: numPages }, (_, i) => {
            const pageNum = i + 1;
            const pageAnns = annotations.filter((a) => a.page === pageNum);
            return (
              <div key={pageNum} ref={(el) => { if (el) pageRefs.current.set(pageNum, el); }} className="relative mx-auto my-3 shadow-md w-fit">
                <Page pageNumber={pageNum} scale={scale} renderAnnotationLayer renderTextLayer />
                {pageAnns.map((ann) => {
                  const s = annotationStyle[ann.type];
                  const isActive = activeAnnotation === ann.id;
                  return (
                    <button key={ann.id} onClick={() => onAnnotationClick(isActive ? null : ann.id)} style={{ left: `${ann.x}%`, top: `${ann.y}%` }} className={
                      `absolute z-10 w-5 h-5 rounded-full border-2 shadow-md transition-transform hover:scale-110
                      ${isActive ? "scale-125 ring-2 ring-offset-1 ring-primary" : ""}
                      ${s.bg} ${s.border}`} />
                  );
                })}
              </div>
            );
          })}
        </Document>
      </div>
    </>
  );
}