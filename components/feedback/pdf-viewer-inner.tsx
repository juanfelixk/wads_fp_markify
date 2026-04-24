"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, AlertCircle, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { annotationStyle } from "@/services/feedback/constants";
import type { Annotation, PdfjsTextItem } from "@/services/feedback/types";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { findHighlightRectsOnPage } from "@/services/feedback/annotation-utils";
import type { TextRect, PageTextData } from "@/services/feedback/types";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  fileUrl: string;
  annotations: Annotation[];
  activeAnnotation: string | null;
  onAnnotationClick: (id: string | null) => void;
  onPageRefsReady: (refs: Map<number, HTMLDivElement>) => void;
}

interface ResolvedAnnotation {
  page: number;
  rects: TextRect[];
}

export default function PdfViewerInner({ fileUrl, annotations, activeAnnotation, onAnnotationClick, onPageRefsReady }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const renderedPagesRef = useRef<Set<number>>(new Set());
  const [resolved, setResolved] = useState<Map<string, ResolvedAnnotation>>(new Map());
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const resolveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // pdfjs-extracted text data
  const pageTextsRef = useRef<Map<number, PageTextData>>(new Map());
  const [pageTextsReady, setPageTextsReady] = useState(false);

  useEffect(() => {
    if (!fileUrl) return;
    pageTextsRef.current.clear();
    setPageTextsReady(false);

    const loadingTask = pdfjs.getDocument(fileUrl);

    loadingTask.promise.then(async (pdf) => {
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const items = content.items as PdfjsTextItem[];
        let joined = "";
        const itemOffsets: number[] = [];
        for (let i = 0; i < items.length; i++) {
          itemOffsets.push(joined.length);
          joined += items[i].str;
          if (i < items.length - 1) {
            joined += items[i].hasEOL ? "\n" : " ";
          }
        }
        pageTextsRef.current.set(p, { joined, itemOffsets, items });
      }
      setPageTextsReady(true);
    }).catch((err) => {
      console.error("[pdfjs] failed to extract text:", err);
    });
    return () => {
      loadingTask.destroy?.();
    };
  }, [fileUrl]);

  const resolveHighlights = useCallback(() => {
    if (pageTextsRef.current.size === 0) return;
    setResolved((prev) => {
      const next = new Map<string, ResolvedAnnotation>();
      for (const ann of annotations) {
        if (!ann.quote) continue;
        const existing = prev.get(ann.id);
        if (existing) {
          const pageEl = pageRefs.current.get(existing.page);
          const pageTextData = pageTextsRef.current.get(existing.page);
          if (pageEl && pageTextData && renderedPagesRef.current.has(existing.page)) {
            const rects = findHighlightRectsOnPage(pageEl, ann.quote, pageTextData);
            if (rects) {
              next.set(ann.id, { page: existing.page, rects });
              continue;
            }
          }
        }
        // search all rendered pages
        for (const [pageNum, pageEl] of pageRefs.current) {
          if (!renderedPagesRef.current.has(pageNum)) continue;
          const pageTextData = pageTextsRef.current.get(pageNum);
          if (!pageTextData) continue;
          const rects = findHighlightRectsOnPage(pageEl, ann.quote, pageTextData);
          if (rects) {
            next.set(ann.id, { page: pageNum, rects });
            break;
          }
        }
      }
      return next;
    });
  }, [annotations]);

  const resolveHighlightsRef = useRef(resolveHighlights);
  useEffect(() => { resolveHighlightsRef.current = resolveHighlights; }, [resolveHighlights]);

  useEffect(() => {
    if (annotations.length > 0 && renderedPagesRef.current.size > 0 && pageTextsReady) {
      resolveHighlightsRef.current();
    }
  }, [annotations, pageTextsReady]);

  function scheduleResolveForPage(pageNum: number) {
    const key = String(pageNum);
    const prev150 = resolveTimers.current.get(`${key}-150`);
    const prev600 = resolveTimers.current.get(`${key}-600`);
    if (prev150) clearTimeout(prev150);
    if (prev600) clearTimeout(prev600);

    resolveTimers.current.set(
      `${key}-150`,
      setTimeout(() => resolveHighlightsRef.current(), 150)
    );
    resolveTimers.current.set(
      `${key}-600`,
      setTimeout(() => resolveHighlightsRef.current(), 600)
    );
  }

  useEffect(() => {
    return () => {
      for (const t of resolveTimers.current.values()) clearTimeout(t);
    };
  }, []);

  function handleLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    onPageRefsReady(pageRefs.current);
  }

  function handlePageRenderSuccess(pageNum: number) {
    renderedPagesRef.current.add(pageNum);
    setRenderedPages((prev) => {
      const next = new Set(prev);
      next.add(pageNum);
      return next;
    });
    scheduleResolveForPage(pageNum);
  }

  function zoom(delta: number) {
    setScale((s) => Math.min(2, Math.max(0.5, Math.round((s + delta) * 10) / 10)));
    renderedPagesRef.current = new Set();
    setResolved(new Map());
    setRenderedPages(new Set());
  }

  const annsByActualPage = new Map<number, Array<{ ann: Annotation; res: ResolvedAnnotation }>>();
  for (const ann of annotations) {
    const res = resolved.get(ann.id);
    if (!res) continue;
    const bucket = annsByActualPage.get(res.page) ?? [];
    bucket.push({ ann, res });
    annsByActualPage.set(res.page, bucket);
  }

  return (
    <>
      {/* zoom controls */}
      <div className="flex items-center px-3 py-2 border-b bg-muted/60 gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto cursor-pointer" onClick={() => zoom(-0.1)} disabled={scale <= 0.5}>
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums w-10 text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => zoom(0.1)} disabled={scale >= 2}>
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="overflow-auto" style={{ maxHeight: "75vh" }}>
        <Document file={fileUrl} onLoadSuccess={handleLoadSuccess} loading={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          }
          error={
            <div className="flex items-center justify-center py-12 text-sm text-destructive gap-2">
              <AlertCircle className="w-4 h-4" /> Failed to load PDF.
            </div>
          }>
          {Array.from({ length: numPages }, (_, i) => {
            const pageNum = i + 1;
            const pageAnns = annsByActualPage.get(pageNum) ?? [];

            return (
              <div key={pageNum} ref={(el) => { if (el) pageRefs.current.set(pageNum, el); }} className="relative mx-auto my-3 shadow-md w-fit">
                <Page pageNumber={pageNum} scale={scale} renderAnnotationLayer renderTextLayer onRenderSuccess={() => handlePageRenderSuccess(pageNum)} />

                {/* per annotation highlight overlays */}
                {pageAnns.map(({ ann, res }) => {
                  const isActive = activeAnnotation === ann.id;
                  const s = annotationStyle[ann.type];
                  const Icon = s.icon;

                  return (
                    <div key={ann.id} className="absolute inset-0 pointer-events-none">
                      {res.rects.map((rect, ri) => (
                        <span key={ri} onClick={() => onAnnotationClick(isActive ? null : ann.id)} style={{ position: "absolute", left: rect.left, top: rect.top, width: rect.width, height: rect.height, backgroundColor: s.rawColor, mixBlendMode: "multiply", cursor: "pointer", pointerEvents: "auto", outline: isActive ? `1px solid ${s.rawBorderColor}` : "none", }} />
                      ))}

                      {res.rects[0] && (
                        <span className={`absolute w-5 h-5 rounded-full flex items-center justify-center shadow ${s.bg} ${s.border} border mix-blend-normal transition-transform ${isActive ? "scale-140" : ""}`}
                          style={{ left: res.rects[0].left - 12, top: res.rects[0].top  - 12, pointerEvents: "auto", cursor: "pointer", }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAnnotationClick(isActive ? null : ann.id);
                          }}>
                          <Icon className={`w-3 h-3 ${s.text}`} />
                        </span>
                      )}
                    </div>
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