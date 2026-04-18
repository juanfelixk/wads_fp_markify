"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, AlertCircle, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { annotationStyle } from "@/services/feedback/constants";
import type { Annotation } from "@/services/feedback/types";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  fileUrl: string;
  annotations: Annotation[];
  activeAnnotation: string | null;
  onAnnotationClick: (id: string | null) => void;
  onPageRefsReady: (refs: Map<number, HTMLDivElement>) => void;
}

interface ResolvedRect { // in px
  left: number;
  top: number;
  width: number;
  height: number;
}

// Search for `quote` text in pdfjs text items and return a bounding rect
// in the PDF's own coordinate space (bottom-left origin, pts).
async function findQuoteRect(pdfDoc: pdfjs.PDFDocumentProxy, pageNum: number, quote: string): Promise<{ x: number; y: number; w: number; h: number; vpWidth: number; vpHeight: number } | null> {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1 });
  const textContent = await page.getTextContent();

  // Flatten all items into a single string + track char→item mapping
  const items = textContent.items as Array<{ str: string; transform: number[]; width: number; height: number }>;

  // Build a flat string with spaces between items
  let flat = "";
  const charMap: Array<{ itemIdx: number; charIdx: number }> = [];
  for (let i = 0; i < items.length; i++) {
    const str = items[i].str;
    for (let j = 0; j < str.length; j++) {
      charMap.push({ itemIdx: i, charIdx: j });
      flat += str[j];
    }
    if (i < items.length - 1) {
      charMap.push({ itemIdx: i, charIdx: -1 }); // space
      flat += " ";
    }
  }

  // Normalise both sides: collapse whitespace, lowercase
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const needle = norm(quote);
  const haystack = norm(flat);

  const matchIdx = haystack.indexOf(needle);
  if (matchIdx === -1) return null;

  // Map match start/end back to real chars (skip the spaces we injected)
  let hi = 0; // index into haystack
  let fi = 0; // index into flat
  const flatToHaystack: number[] = []; // flat index → haystack index
  for (let k = 0; k < flat.length; k++) {
    flatToHaystack.push(hi);
    const fc = flat[k].toLowerCase();
    if (fc === " " && haystack[hi] === " ") { hi++; }
    else if (fc !== " " || haystack[hi] !== " ") { hi++; }
  }

  // Find which flat chars correspond to our match
  const matchStart = flatToHaystack.indexOf(matchIdx);
  const matchEnd = flatToHaystack.indexOf(matchIdx + needle.length - 1);

  if (matchStart === -1 || matchEnd === -1) return null;

  // Collect the pdfjs items that cover the match
  const coveredItems = new Set<number>();
  for (let k = matchStart; k <= matchEnd; k++) {
    if (charMap[k]?.charIdx !== -1) coveredItems.add(charMap[k].itemIdx);
  }

  // Union their bounding boxes (PDF coords: bottom-left origin)
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const idx of coveredItems) {
    const item = items[idx];
    const [, , , , tx, ty] = item.transform; // tx=x, ty=y (bottom-left of text)
    const iw = item.width;
    const ih = item.height || 12;
    minX = Math.min(minX, tx);
    minY = Math.min(minY, ty);
    maxX = Math.max(maxX, tx + iw);
    maxY = Math.max(maxY, ty + ih);
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
    vpWidth: viewport.width,
    vpHeight: viewport.height,
  };
}

// Convert PDF point coords (bottom-left origin) → CSS px (top-left origin)
// scaled to the rendered canvas size.
function pdfRectToCss(
  rect: { x: number; y: number; w: number; h: number; vpWidth: number; vpHeight: number },
  scale: number
): ResolvedRect {
  // pdfjs viewport already accounts for the page's media box
  const scaleX = (rect.vpWidth * scale) / rect.vpWidth;
  const left   = rect.x * scaleX;
  const width  = rect.w * scaleX;
  // flip y: CSS top = vpHeight - (pdfY + pdfHeight)
  const top    = (rect.vpHeight - rect.y - rect.h) * scale;
  const height = rect.h * scale;
  return { left, top, width, height };
}

export default function PdfViewerInner({
  fileUrl,
  annotations,
  activeAnnotation,
  onAnnotationClick,
  onPageRefsReady,
}: Props) {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale]       = useState(1);
  const [pdfDoc, setPdfDoc]     = useState<pdfjs.PDFDocumentProxy | null>(null);
  // resolvedRects[annId] = CSS pixel rect relative to the page div
  const [resolvedRects, setResolvedRects] = useState<Record<string, ResolvedRect>>({});
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Re-resolve when scale or annotations change
  useEffect(() => {
    if (!pdfDoc || annotations.length === 0) return;
    let cancelled = false;

    async function resolveAll() {
      const result: Record<string, ResolvedRect> = {};
      for (const ann of annotations) {
        if (!ann.quote) continue;
        try {
          const rect = await findQuoteRect(pdfDoc!, ann.page, ann.quote);
          if (rect && !cancelled) {
            result[ann.id] = pdfRectToCss(rect, scale);
          }
        } catch {
          // fall back to percentage position
        }
      }
      if (!cancelled) setResolvedRects(result);
    }

    resolveAll();
    return () => { cancelled = true; };
  }, [pdfDoc, annotations, scale]);

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
        <span className="text-xs text-muted-foreground tabular-nums w-10 text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => zoom(0.1)} disabled={scale >= 2}>
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="overflow-auto" style={{ maxHeight: "75vh" }}>
        <Document
  file={fileUrl}
  onLoadSuccess={(pdf) => {
    handleLoadSuccess({ numPages: pdf.numPages });
    setPdfDoc(pdf);          // ← pdf IS the PDFDocumentProxy
  }}
          loading={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          }
          error={
            <div className="flex items-center justify-center py-12 text-sm text-destructive gap-2">
              <AlertCircle className="w-4 h-4" /> Failed to load PDF.
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => {
            const pageNum  = i + 1;
            const pageAnns = annotations.filter((a) => a.page === pageNum);

            return (
              <div
                key={pageNum}
                ref={(el) => { if (el) pageRefs.current.set(pageNum, el); }}
                className="relative mx-auto my-3 shadow-md w-fit"
              >
                <Page
                  pageNumber={pageNum}
                  scale={scale}
                  renderAnnotationLayer
                  renderTextLayer
                />

                {pageAnns.map((ann) => {
                  const isActive = activeAnnotation === ann.id;
                  const s = annotationStyle[ann.type];
                  const Icon = s.icon;

                  // Prefer text-search resolved rect; fall back to AI-stored coords
// DB stores values in PDF points (same space as pdfjs), so convert them
// the same way as resolved rects rather than treating them as percentages.
const resolved = resolvedRects[ann.id];

let style: React.CSSProperties;
if (resolved) {
  style = {
    left:   resolved.left,
    top:    resolved.top,
    width:  resolved.width,
    height: resolved.height,
  };
} else if (ann.width != null && ann.height != null) {
  // ann.x/y are PDF points (bottom-left origin); convert to CSS px
  // We need the viewport to do this properly, so approximate using
  // the standard A4 PDF point height (841.89 pt) at current scale.
  // This is only the fallback — quotes resolve via text search above.
  const PDF_PAGE_HEIGHT_PT = 841.89;
  style = {
    left:   ann.x * scale,
    top:    (PDF_PAGE_HEIGHT_PT - ann.y - ann.height) * scale,
    width:  ann.width * scale,
    height: ann.height * scale,
  };
} else {
  style = { left: "10%", top: "10%", width: "20%", height: "3%" };
}

                  return (
                    <button
                      key={ann.id}
                      onClick={() => onAnnotationClick(isActive ? null : ann.id)}
                      style={style}
                      className={`absolute cursor-pointer transition-all mix-blend-multiply dark:mix-blend-screen rounded-sm border ${s.bg} ${isActive ? `${s.border}`: ""}`}
                    >
                      <span className={`absolute -top-3 -left-3 w-5 h-5 rounded-full flex items-center justify-center shadow mix-blend-normal ${s.bg} ${s.border} border transition-transform ${isActive ? "scale-140" : ""}`}>
                        <Icon className={`w-3 h-3 ${s.text}`} />
                      </span>
                    </button>
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