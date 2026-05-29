import { render, screen, fireEvent } from "@testing-library/react";
import PdfViewerInner from "@/components/feedback/pdf-viewer-inner";
import { Annotation } from "@/services/feedback/types";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("react-pdf", () => ({
  Document: ({ children, onLoadSuccess, loading, error, file }: any) => {
    // Simulate successful load by default
    if (onLoadSuccess) onLoadSuccess({ numPages: 3 });
    return <div data-testid="pdf-document">{children}</div>;
  },
  Page: ({ pageNumber, onRenderSuccess }: any) => {
    if (onRenderSuccess) onRenderSuccess();
    return <div data-testid={`pdf-page-${pageNumber}`} />;
  },
  pdfjs: {
    version: "3.0.0",
    GlobalWorkerOptions: { workerSrc: "" },
    getDocument: jest.fn(() => ({
      promise: Promise.resolve({
        numPages: 3,
        getPage: jest.fn(() =>
          Promise.resolve({
            getTextContent: jest.fn(() =>
              Promise.resolve({ items: [] })
            ),
          })
        ),
      }),
      destroy: jest.fn(),
    })),
  },
}));

jest.mock("@/services/feedback/constants", () => ({
  annotationStyle: {
    PRAISE: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", rawColor: "#bbf7d0", rawBorderColor: "#16a34a", icon: () => <span data-testid="icon-praise" />, label: "Praise" },
    ISSUE:  { bg: "bg-red-50",   border: "border-red-200",   text: "text-red-700",   rawColor: "#fecaca",  rawBorderColor: "#dc2626", icon: () => <span data-testid="icon-issue" />,  label: "Issue"  },
    SUGGESTION: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", rawColor: "#bfdbfe", rawBorderColor: "#2563eb", icon: () => <span data-testid="icon-suggestion" />, label: "Suggestion" },
  },
}));

jest.mock("@/services/feedback/annotation-utils", () => ({
  findHighlightRectsOnPage: jest.fn(),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

// css imports that jest can't handle
jest.mock("react-pdf/dist/Page/TextLayer.css", () => {});
jest.mock("react-pdf/dist/Page/AnnotationLayer.css", () => {});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseProps = {
  fileUrl: "http://example.com/test.pdf",
  annotations: [] as Annotation[],
  activeAnnotation: null,
  onAnnotationClick: jest.fn(),
  onPageRefsReady: jest.fn(),
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("PdfViewerInner — rendering", () => {
  it("renders the PDF document", () => {
    render(<PdfViewerInner {...baseProps} />);
    expect(screen.getByTestId("pdf-document")).toBeInTheDocument();
  });

  it("renders all pages returned by onLoadSuccess", () => {
    render(<PdfViewerInner {...baseProps} />);
    expect(screen.getByTestId("pdf-page-1")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-page-2")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-page-3")).toBeInTheDocument();
  });

  it("calls onPageRefsReady after document loads", () => {
    render(<PdfViewerInner {...baseProps} />);
    expect(baseProps.onPageRefsReady).toHaveBeenCalledWith(expect.any(Map));
  });
});

describe("PdfViewerInner — zoom controls", () => {
  it("renders zoom in and zoom out buttons", () => {
    render(<PdfViewerInner {...baseProps} />);
    // 100% is the default scale display
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("zoom out button is disabled at minimum scale (0.5)", () => {
    render(<PdfViewerInner {...baseProps} />);
    const [zoomOut] = screen.getAllByRole("button");

    // click zoom out 5 times to reach 0.5
    for (let i = 0; i < 5; i++) fireEvent.click(zoomOut);
    expect(zoomOut).toBeDisabled();
  });

  it("zoom in button is disabled at maximum scale (2.0)", () => {
    render(<PdfViewerInner {...baseProps} />);
    const buttons = screen.getAllByRole("button");
    const zoomIn = buttons[buttons.length - 1];

    // click zoom in 10 times to reach 2.0
    for (let i = 0; i < 10; i++) fireEvent.click(zoomIn);
    expect(zoomIn).toBeDisabled();
  });

  it("updates the scale display when zooming in", () => {
    render(<PdfViewerInner {...baseProps} />);
    const buttons = screen.getAllByRole("button");
    const zoomIn = buttons[buttons.length - 1];

    fireEvent.click(zoomIn);
    expect(screen.getByText("110%")).toBeInTheDocument();
  });

  it("updates the scale display when zooming out", () => {
    render(<PdfViewerInner {...baseProps} />);
    const [zoomOut] = screen.getAllByRole("button");

    fireEvent.click(zoomOut);
    expect(screen.getByText("90%")).toBeInTheDocument();
  });
});