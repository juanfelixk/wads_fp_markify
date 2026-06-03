import { render, screen, fireEvent } from "@testing-library/react";
import StructureCard from "@/components/feedback/structure-card";
import { StructureFeedback } from "@/services/feedback/types";

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div data-testid="card-header" className={className}>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children, open, onOpenChange }: any) => (
    <div data-testid="collapsible" data-open={String(open)}>{children}</div>
  ),
  CollapsibleTrigger: ({ children }: any) => <div data-testid="collapsible-trigger">{children}</div>,
  CollapsibleContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/progress", () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />,
}));

const makeSection = (overrides = {}) => ({
  name: "Introduction",
  score: 7,
  maxScore: 10,
  feedback: "Good opening but lacks a clear thesis.",
  ...overrides,
});

const makeStructure = (overrides: Partial<StructureFeedback> = {}): StructureFeedback => ({
  overview: "Overall structure is adequate.",
  sections: [makeSection()],
  ...overrides,
});

describe("StructureCard — empty state", () => {
  it("shows AI unavailable when aiTimedOut is true", () => {
    render(<StructureCard structure={null} aiTimedOut={true} status="PENDING" />);
    expect(screen.getByText(/AI currently unavailable/i)).toBeInTheDocument();
  });

  it("shows 'No issue found' for terminal statuses", () => {
    for (const status of ["TO_BE_REVIEWED", "GRADED", "GRADE_SAVED"]) {
      const { unmount } = render(<StructureCard structure={null} aiTimedOut={false} status={status} />);
      expect(screen.getByText(/no issue found/i)).toBeInTheDocument();
      unmount();
    }
  });

  it("shows 'Analysis in progress' for non-terminal statuses", () => {
    render(<StructureCard structure={null} status="PENDING" />);
    expect(screen.getByText(/analysis in progress/i)).toBeInTheDocument();
  });

  it("renders empty state when sections array is empty", () => {
    render(<StructureCard structure={makeStructure({ sections: [] })} status="TO_BE_REVIEWED" />);
    expect(screen.getByText(/no issue found/i)).toBeInTheDocument();
  });

  it("aiTimedOut takes priority over terminal status", () => {
    render(<StructureCard structure={null} aiTimedOut={true} status="GRADED" />);
    expect(screen.getByText(/AI currently unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/no issue found/i)).not.toBeInTheDocument();
  });
});

describe("StructureCard — with sections", () => {
  const structure = makeStructure({
    overview: "Solid essay structure.",
    sections: [
      makeSection({ name: "Introduction", score: 7, maxScore: 10, feedback: "Needs a clearer thesis." }),
      makeSection({ name: "Body", score: 9, maxScore: 10, feedback: "Well-developed arguments." }),
    ],
  });

  it("renders overview text", () => {
    render(<StructureCard structure={structure} status="TO_BE_REVIEWED" />);
    expect(screen.getByText("Solid essay structure.")).toBeInTheDocument();
  });

  it("renders all section names", () => {
    render(<StructureCard structure={structure} status="TO_BE_REVIEWED" />);
    expect(screen.getByText("Introduction")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("renders score and maxScore for each section", () => {
    render(<StructureCard structure={structure} status="TO_BE_REVIEWED" />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    // maxScore rendered as /10 twice
    expect(screen.getAllByText("/10")).toHaveLength(2);
  });

  it("renders a Progress bar with correct value for each section", () => {
    render(<StructureCard structure={structure} status="TO_BE_REVIEWED" />);
    const bars = screen.getAllByTestId("progress");
    expect(bars[0]).toHaveAttribute("data-value", "70");
    expect(bars[1]).toHaveAttribute("data-value", "90");
  });

  it("renders section feedback text", () => {
    render(<StructureCard structure={structure} status="TO_BE_REVIEWED" />);
    expect(screen.getByText("Needs a clearer thesis.")).toBeInTheDocument();
    expect(screen.getByText("Well-developed arguments.")).toBeInTheDocument();
  });

  it("does not render overview when absent", () => {
    render(<StructureCard structure={makeStructure({ overview: undefined })} status="TO_BE_REVIEWED" />);
    expect(screen.queryByText("Solid essay structure.")).not.toBeInTheDocument();
  });
});

describe("StructureCard — collapsible", () => {
  it("starts collapsed", () => {
    render(<StructureCard structure={makeStructure()} status="TO_BE_REVIEWED" />);
    expect(screen.getByTestId("collapsible")).toHaveAttribute("data-open", "false");
  });

  it("expands on header click", () => {
    render(<StructureCard structure={makeStructure()} status="TO_BE_REVIEWED" />);
    fireEvent.click(screen.getByTestId("card-header"));
    expect(screen.getByTestId("collapsible")).toHaveAttribute("data-open", "true");
  });

  it("collapses again on second click", () => {
    render(<StructureCard structure={makeStructure()} status="TO_BE_REVIEWED" />);
    fireEvent.click(screen.getByTestId("card-header"));
    fireEvent.click(screen.getByTestId("card-header"));
    expect(screen.getByTestId("collapsible")).toHaveAttribute("data-open", "false");
  });
});