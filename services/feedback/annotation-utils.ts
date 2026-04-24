import { TextRect, PageTextData, PdfjsTextItem } from "./types";

// normalize input
const norm = (s: string) => s.normalize("NFKC")
    .replace(/[''`]/g, "'")
    .replace(/[""‟]/g, '"')
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/[\s\u00a0\u200b\u200c\u200d\ufeff]+/g, " ")
    .trim()
    .toLowerCase();

function buildNormToJoined(joined: string): number[] {
    const result: number[] = [];
    let lastWasSpace = false;
    for (let ji = 0; ji < joined.length; ji++) {
        const ch = joined[ji];
        const expanded = ch.normalize("NFKC")
            .replace(/[''`]/g, "'")
            .replace(/[""‟]/g, '"')
            .replace(/[‐‑‒–—―]/g, "-");
        const isSpace = /[\s\u00a0\u200b\u200c\u200d\ufeff]/.test(expanded);
        if (isSpace) {
            if (!lastWasSpace) {
                result.push(ji);
                lastWasSpace = true;
            }
        } else {
            lastWasSpace = false;
            for (let ei = 0; ei < expanded.length; ei++) {
                result.push(ji);
            }
        }
    }
    return result;
}

export function findHighlightRectsOnPage(pageEl: HTMLDivElement, quote: string, pageTextData: PageTextData): TextRect[] | null {
    const { joined, itemOffsets, items } = pageTextData;
    const needle = norm(quote);
    const haystack = norm(joined);
    const matchIdx = haystack.indexOf(needle);

    if (matchIdx === -1) return null;

    // map norm positions into joined positions
    const normToJoined = buildNormToJoined(joined);
    const joinedStart = normToJoined[matchIdx];
    const joinedEnd = normToJoined[matchIdx + needle.length - 1];
    if (joinedStart === undefined || joinedEnd === undefined) return null;

    type ItemSpan = { itemIdx: number; start: number; end: number };
    const coveredItems: ItemSpan[] = [];

    for (let i = 0; i < items.length; i++) {
        const iStart = itemOffsets[i];
        const iEnd = iStart + items[i].str.length - 1;
        if (iEnd < joinedStart) continue;
        if (iStart > joinedEnd) break;
        const spanStart = Math.max(joinedStart, iStart) - iStart;
        const spanEnd = Math.min(joinedEnd,   iEnd)   - iStart;
        coveredItems.push({ itemIdx: i, start: spanStart, end: spanEnd });
    }

    if (coveredItems.length === 0) return null;

    const textLayer = pageEl.querySelector(".textLayer") as HTMLElement | null;
    if (!textLayer) return null;

    const spans = Array.from(textLayer.querySelectorAll<HTMLElement>("span")).filter((el) => (el.textContent?.length ?? 0) > 0);

    const itemToSpan = new Map<number, HTMLElement>();

    let spanCursor = 0;
    for (let i = 0; i < items.length && spanCursor < spans.length; i++) {
        const itemStr = items[i].str;
        if (!itemStr.trim()) continue; // skip whitespace only items

        // search for a matching span
        for (let si = spanCursor; si < Math.min(spanCursor + 5, spans.length); si++) {
        const spanText = spans[si].textContent ?? "";
        if (spanText.trim() === itemStr.trim()) {
            itemToSpan.set(i, spans[si]);
            spanCursor = si + 1;
            break;
        }
        }
    }

    const pageRect = pageEl.getBoundingClientRect();
    const allRects: TextRect[] = [];

    for (const { itemIdx, start, end } of coveredItems) {
        const span = itemToSpan.get(itemIdx);
        if (!span) continue;
        const textNode = span.firstChild;
        if (!textNode || textNode.nodeType !== Node.TEXT_NODE) continue;
        const textLen = (textNode as Text).length;
        try {
        const range = document.createRange();
        range.setStart(textNode, Math.min(start, textLen));
        range.setEnd(textNode, Math.min(end + 1, textLen));
        for (const r of Array.from(range.getClientRects())) {
            if (r.width < 1) continue;
            allRects.push({
            left:   r.left   - pageRect.left,
            top:    r.top    - pageRect.top,
            width:  r.width,
            height: r.height,
            });
        }
        } catch {
        // offset out of bounds, skip
        }
    }
    return allRects.length > 0 ? allRects : null;
}

export async function extractPageTexts(pdfBuffer: Buffer): Promise<Map<number, PageTextData>> {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();

    const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
    }).promise;

    const pageTexts = new Map<number, PageTextData>();

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
        pageTexts.set(p, { joined, itemOffsets, items });
    }
    return pageTexts;
}

export async function resolveAnnotationPages<T extends { quote: string | null; page: number }> (pdfBuffer: Buffer, annotations: T[]): Promise<T[]> {
    const pageTexts = await extractPageTexts(pdfBuffer);
    return annotations.map((ann) => {
        if (!ann.quote) return ann;
        const needle = norm(ann.quote);
        for (const [pageNum, { joined }] of pageTexts) {
            if (norm(joined).includes(needle)) {
                return { ...ann, page: pageNum };
            }
        }
        return ann; // fallback: keep AI's page if quote not found
    });
}