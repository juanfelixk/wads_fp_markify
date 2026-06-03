import { render, screen, fireEvent } from "@testing-library/react";
import GrammarCard from "@/components/feedback/grammar-card";
import { GrammarFeedback } from "@/services/feedback/types";

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
    <div data-testid="card-header" className={className} onClick={onClick}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-title" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}));

jest.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange: (v: boolean) => void }) => (
    <div data-testid="collapsible" data-open={String(open)}>{children}</div>
  ),
  CollapsibleTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => (
    <>{children}</>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="collapsible-content">{children}</div>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, className, variant }: { children: React.ReactNode; className?: string; variant?: string }) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}));

const makeIssue = (overrides = {}) => ({
  type: "grammar",
  severity: "medium" as const,
  original: "He go to school.",
  suggestion: "He goes to school.",
  explanation: "Subject-verb agreement error.",
  ...overrides,
});

const makeGrammar = (overrides: Partial<GrammarFeedback> = {}): GrammarFeedback => ({
  summary: "A few grammatical issues were found.",
  issues: [makeIssue()],
  ...overrides,
});

describe("GrammarCard — empty state", () => {
  it("renders AI unavailable message when aiTimedOut is true", () => {
    render(<GrammarCard grammar={null} aiTimedOut={true} status="PENDING" />);
    expect(screen.getByText(/AI currently unavailable, please try again later/i)).toBeInTheDocument();
  });

  it("renders 'No issue found' when status is TO_BE_REVIEWED", () => {
    render(<GrammarCard grammar={null} aiTimedOut={false} status="TO_BE_REVIEWED" />);
    expect(screen.getByText(/no issue found/i)).toBeInTheDocument();
  });

  it("renders 'No issue found' when status is GRADED", () => {
    render(<GrammarCard grammar={null} aiTimedOut={false} status="GRADED" />);
    expect(screen.getByText(/no issue found/i)).toBeInTheDocument();
  });

  it("renders 'No issue found' when status is GRADE_SAVED", () => {
    render(<GrammarCard grammar={null} aiTimedOut={false} status="GRADE_SAVED" />);
    expect(screen.getByText(/no issue found/i)).toBeInTheDocument();
  });

  it("renders 'Analysis in progress' for any other status", () => {
    render(<GrammarCard grammar={null} status="PENDING" />);
    expect(screen.getByText(/analysis in progress/i)).toBeInTheDocument();
  });

  it("renders a dashed card border in the empty state", () => {
    render(<GrammarCard grammar={null} status="PENDING" />);
    expect(screen.getByTestId("card")).toHaveClass("border-dashed");
  });

  it("renders empty state when grammar has an empty issues array", () => {
    render(<GrammarCard grammar={makeGrammar({ issues: [] })} status="TO_BE_REVIEWED" />);
    expect(screen.getByText(/no issue found/i)).toBeInTheDocument();
  });

  it("shows AI timeout message even when status is GRADED", () => {
    render(<GrammarCard grammar={null} aiTimedOut={true} status="GRADED" />);
    expect(screen.getByText(/AI currently unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/no issue found/i)).not.toBeInTheDocument();
  });
});

describe("GrammarCard — with issues", () => {
  const grammar = makeGrammar({
    summary: "Two issues were detected.",
    issues: [
      makeIssue({ type: "grammar", severity: "high", original: "She go.", suggestion: "She goes.", explanation: "Agreement error." }),
      makeIssue({ type: "punctuation", severity: "low", original: "Hello world", suggestion: "Hello, world", explanation: "Missing comma." }),
    ],
  });

  it("renders the issue count badge", () => {
    render(<GrammarCard grammar={grammar} status="TO_BE_REVIEWED" />);
    const badges = screen.getAllByTestId("badge");
    expect(badges[0]).toHaveTextContent("2");
  });

  it("renders the summary text", () => {
    render(<GrammarCard grammar={grammar} status="TO_BE_REVIEWED" />);
    expect(screen.getByText("Two issues were detected.")).toBeInTheDocument();
  });

  it("renders all issues", () => {
    render(<GrammarCard grammar={grammar} status="TO_BE_REVIEWED" />);
    expect(screen.getByText("Agreement error.")).toBeInTheDocument();
    expect(screen.getByText("Missing comma.")).toBeInTheDocument();
  });

  it("renders original text with strikethrough for each issue", () => {
    render(<GrammarCard grammar={grammar} status="TO_BE_REVIEWED" />);
    expect(screen.getByText("She go.")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders suggestion text for each issue", () => {
    render(<GrammarCard grammar={grammar} status="TO_BE_REVIEWED" />);
    expect(screen.getByText(/She goes\./)).toBeInTheDocument();
    expect(screen.getByText(/Hello, world/)).toBeInTheDocument();
  });

  it("renders type badge for each issue", () => {
    render(<GrammarCard grammar={grammar} status="TO_BE_REVIEWED" />);
    expect(screen.getByText("grammar")).toBeInTheDocument();
    expect(screen.getByText("punctuation")).toBeInTheDocument();
  });

  it("renders severity labels for each issue", () => {
    render(<GrammarCard grammar={grammar} status="TO_BE_REVIEWED" />);
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("low")).toBeInTheDocument();
  });

  it("does not render a dashed card border when issues exist", () => {
    render(<GrammarCard grammar={grammar} status="TO_BE_REVIEWED" />);
    expect(screen.getByTestId("card")).not.toHaveClass("border-dashed");
  });

  it("does not render original when it is absent", () => {
    const g = makeGrammar({ issues: [makeIssue({ original: undefined })] });
    render(<GrammarCard grammar={g} status="TO_BE_REVIEWED" />);
    expect(screen.queryByText("He go to school.")).not.toBeInTheDocument();
  });

  it("does not render suggestion when it is absent", () => {
    const g = makeGrammar({ issues: [makeIssue({ suggestion: undefined })] });
    render(<GrammarCard grammar={g} status="TO_BE_REVIEWED" />);
    expect(screen.queryByText(/→/)).not.toBeInTheDocument();
  });

  it("does not render summary when it is absent", () => {
    const g = makeGrammar({ summary: undefined });
    render(<GrammarCard grammar={g} status="TO_BE_REVIEWED" />);
    expect(screen.queryByText("A few grammatical issues were found.")).not.toBeInTheDocument();
  });
});

describe("GrammarCard — collapsible behaviour", () => {
  it("starts collapsed by default", () => {
    render(<GrammarCard grammar={makeGrammar()} status="TO_BE_REVIEWED" />);
    expect(screen.getByTestId("collapsible")).toHaveAttribute("data-open", "false");
  });

  it("expands when the header is clicked", () => {
    render(<GrammarCard grammar={makeGrammar()} status="TO_BE_REVIEWED" />);
    fireEvent.click(screen.getByTestId("card-header"));
    expect(screen.getByTestId("collapsible")).toHaveAttribute("data-open", "true");
  });

  it("collapses again when the header is clicked a second time", () => {
    render(<GrammarCard grammar={makeGrammar()} status="TO_BE_REVIEWED" />);
    fireEvent.click(screen.getByTestId("card-header"));
    fireEvent.click(screen.getByTestId("card-header"));
    expect(screen.getByTestId("collapsible")).toHaveAttribute("data-open", "false");
  });
});