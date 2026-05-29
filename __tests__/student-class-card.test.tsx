import { render, screen, fireEvent } from "@testing-library/react";
import ClassCard from "@/components/dashboard/student-class-card";
import { ClassSummary } from "@/services/classes/types";

// 1 FAILURE

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/accent-color", () => ({
  getAccentColor: jest.fn(() => "210 100% 56%"),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant }: any) => (
    <button onClick={onClick} data-variant={variant}>{children}</button>
  ),
}));

jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: any) => <div>{children}</div>,
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
  AlertDialogAction: ({ children, onClick }: any) => (
    <button data-testid="confirm-delete" onClick={onClick}>{children}</button>
  ),
}));

// ─── Fixture ──────────────────────────────────────────────────────────────────

const cls: ClassSummary = {
  classId: "cls-1",
  courseCode: "CS",
  classCode: "A",
  courseName: "Software Engineering",
  lecturer: "Dr. Smith",
  students: 30,
  institution: "BINUS",
  academicYear: "2025/2026",
  enrollmentKey: "1234",
};

const baseProps = {
  cls,
  onView: jest.fn(),
  onDelete: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ClassCard — rendering", () => {
  it("renders course code and class code", () => {
    render(<ClassCard {...baseProps} />);
    expect(screen.getByText("CS - A")).toBeInTheDocument();
  });

  it("renders course name", () => {
    render(<ClassCard {...baseProps} />);
    expect(screen.getByText("Software Engineering")).toBeInTheDocument();
  });

  it("renders lecturer name", () => {
    render(<ClassCard {...baseProps} />);
    expect(screen.getByText("Dr. Smith")).toBeInTheDocument();
  });

  it("renders 'students' (plural) when count > 1", () => {
    render(<ClassCard {...baseProps} />);
    expect(screen.getByText(/30\s*students/i)).toBeInTheDocument();
  });

  it("renders 'student' (singular) when count is 1", () => {
    render(<ClassCard {...baseProps} cls={{ ...cls, students: 1 }} />);
    expect(screen.getByText(/1\s*student/i)).toBeInTheDocument();
    expect(screen.queryByText(/1\s*students/i)).not.toBeInTheDocument();
  });
});

describe("ClassCard — interactions", () => {
  it("calls onView when 'View Class' is clicked", () => {
    render(<ClassCard {...baseProps} />);
    fireEvent.click(screen.getByText("View Class"));
    expect(baseProps.onView).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete when confirm button is clicked", () => {
    render(<ClassCard {...baseProps} />);
    fireEvent.click(screen.getByTestId("confirm-delete"));
    expect(baseProps.onDelete).toHaveBeenCalledTimes(1);
  });

  it("does not call onDelete when cancel is clicked", () => {
    render(<ClassCard {...baseProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(baseProps.onDelete).not.toHaveBeenCalled();
  });

  it("shows the course name in the delete confirmation", () => {
    render(<ClassCard {...baseProps} />);
    expect(screen.getByText("Software Engineering", { selector: "span" })).toBeInTheDocument();
  });
});