import { render, screen, fireEvent } from "@testing-library/react";
import AnnotationSidebar from "@/components/feedback/annotation-card";
import { Annotation } from "@/services/feedback/types";

jest.mock("@/services/feedback/constants", () => ({
  annotationStyle: {
    PRAISE: {
      label: "Praise",
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      icon: () => <span data-testid="icon-praise" />,
    },
    ISSUE: {
      label: "Issue",
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      icon: () => <span data-testid="icon-issue" />,
    },
    SUGGESTION: {
      label: "Suggestion",
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      icon: () => <span data-testid="icon-suggestion" />,
    },
  },
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}));

const makeAnnotation = (overrides: Partial<Annotation> = {}): Annotation => ({
  id: "ann-1",
  type: "ISSUE",
  page: 1,
  quote: "some quoted text",
  content: "This is the annotation content.",
  source: "AI",
  ...overrides,
});

describe("AnnotationSidebar — empty state", () => {
  it("renders the AI unavailable message when aiTimedOut is true", () => {
    render(
      <AnnotationSidebar
        annotations={[]}
        activeId={null}
        onSelect={jest.fn()}
        aiTimedOut={true}
        status="PENDING"
      />
    );

    expect(
      screen.getByText(/AI currently unavailable, please try again later/i)
    ).toBeInTheDocument();
  });

  it("renders 'No issue found' when status is TO_BE_REVIEWED and AI did not time out", () => {
    render(
      <AnnotationSidebar
        annotations={[]}
        activeId={null}
        onSelect={jest.fn()}
        aiTimedOut={false}
        status="TO_BE_REVIEWED"
      />
    );

    expect(screen.getByText(/no issue found/i)).toBeInTheDocument();
  });

  it("renders 'Analysis in progress' for any other status", () => {
    render(
      <AnnotationSidebar
        annotations={[]}
        activeId={null}
        onSelect={jest.fn()}
        status="PENDING"
      />
    );

    expect(screen.getByText(/analysis in progress/i)).toBeInTheDocument();
  });

  it("renders a dashed card border in the empty state", () => {
    render(
      <AnnotationSidebar
        annotations={[]}
        activeId={null}
        onSelect={jest.fn()}
        status="PENDING"
      />
    );

    expect(screen.getByTestId("card")).toHaveClass("border-dashed");
  });

  it("shows AI timeout message even when status is TO_BE_REVIEWED", () => {
    render(
      <AnnotationSidebar
        annotations={[]}
        activeId={null}
        onSelect={jest.fn()}
        aiTimedOut={true}
        status="TO_BE_REVIEWED"
      />
    );

    expect(
      screen.getByText(/AI currently unavailable/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/no issue found/i)).not.toBeInTheDocument();
  });
});

describe("AnnotationSidebar — with annotations", () => {
  const annotations: Annotation[] = [
    makeAnnotation({ id: "ann-1", type: "ISSUE", page: 2, quote: "bad phrasing", content: "Rephrase this." }),
    makeAnnotation({ id: "ann-2", type: "PRAISE", page: 3, quote: "great intro", content: "Well structured." }),
    makeAnnotation({ id: "ann-3", type: "SUGGESTION", page: 5, quote: undefined, content: "Consider adding examples." }),
  ];

  it("renders all annotation items", () => {
    render(
      <AnnotationSidebar
        annotations={annotations}
        activeId={null}
        onSelect={jest.fn()}
        status="TO_BE_REVIEWED"
      />
    );

    expect(screen.getByText("Rephrase this.")).toBeInTheDocument();
    expect(screen.getByText("Well structured.")).toBeInTheDocument();
    expect(screen.getByText("Consider adding examples.")).toBeInTheDocument();
  });

  it("renders count badges for each type present", () => {
    render(
      <AnnotationSidebar
        annotations={annotations}
        activeId={null}
        onSelect={jest.fn()}
        status="TO_BE_REVIEWED"
      />
    );

    expect(screen.getByText(/1 Issue/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Praise/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Suggestion/i)).toBeInTheDocument();
  });

  it("does not render a badge for a type with zero count", () => {
    const issueOnly = [makeAnnotation({ id: "ann-1", type: "ISSUE" })];

    render(
      <AnnotationSidebar
        annotations={issueOnly}
        activeId={null}
        onSelect={jest.fn()}
        status="TO_BE_REVIEWED"
      />
    );

    expect(screen.queryByText(/praise/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/suggestion/i)).not.toBeInTheDocument();
  });

  it("renders the page number for each annotation", () => {
    render(
      <AnnotationSidebar
        annotations={annotations}
        activeId={null}
        onSelect={jest.fn()}
        status="TO_BE_REVIEWED"
      />
    );

    expect(screen.getByText(/page 2/i)).toBeInTheDocument();
    expect(screen.getByText(/page 3/i)).toBeInTheDocument();
    expect(screen.getByText(/page 5/i)).toBeInTheDocument();
  });

  it("renders the quote when present", () => {
    render(
      <AnnotationSidebar
        annotations={annotations}
        activeId={null}
        onSelect={jest.fn()}
        status="TO_BE_REVIEWED"
      />
    );

    expect(screen.getByText((_, el) => el?.textContent === '"bad phrasing"')).toBeInTheDocument();
  });

  it("does not render a quote element when quote is absent", () => {
    render(
      <AnnotationSidebar
        annotations={annotations}
        activeId={null}
        onSelect={jest.fn()}
        status="TO_BE_REVIEWED"
      />
    );

    expect(screen.getByText("Consider adding examples.")).toBeInTheDocument();
    const quotes = screen.queryAllByText(/^".*"$/);
    quotes.forEach((q) => {
      expect(q.textContent).not.toBe('""');
    });
  });
});

describe("AnnotationSidebar — interactions", () => {
  const annotations: Annotation[] = [
    makeAnnotation({ id: "ann-1", type: "ISSUE", content: "Fix this." }),
    makeAnnotation({ id: "ann-2", type: "PRAISE", content: "Good work." }),
  ];

  it("calls onSelect with the annotation id when an inactive item is clicked", () => {
    const onSelect = jest.fn();

    render(
      <AnnotationSidebar
        annotations={annotations}
        activeId={null}
        onSelect={onSelect}
        status="TO_BE_REVIEWED"
      />
    );

    fireEvent.click(screen.getByText("Fix this."));
    expect(onSelect).toHaveBeenCalledWith("ann-1");
  });

  it("calls onSelect with null when the active item is clicked (deselect)", () => {
    const onSelect = jest.fn();

    render(
      <AnnotationSidebar
        annotations={annotations}
        activeId="ann-1"
        onSelect={onSelect}
        status="TO_BE_REVIEWED"
      />
    );

    fireEvent.click(screen.getByText("Fix this."));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("calls onSelect with the correct id when a different inactive item is clicked", () => {
    const onSelect = jest.fn();

    render(
      <AnnotationSidebar
        annotations={annotations}
        activeId="ann-1"
        onSelect={onSelect}
        status="TO_BE_REVIEWED"
      />
    );

    fireEvent.click(screen.getByText("Good work."));
    expect(onSelect).toHaveBeenCalledWith("ann-2");
  });
});