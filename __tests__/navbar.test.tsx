import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Navbar from "@/components/dashboard/navbar";
import * as authClient from "@/services/auth/client";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
let mockPathname = "/dashboard/student";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src }: any) => <img alt={alt} src={src} />,
}));

jest.mock("@/services/auth/client", () => ({
  authClient: { signOut: jest.fn() },
}));

jest.mock("@/lib/avatar", () => ({
  getAvatarUrl: (name: string) => `https://avatar.example.com/${name}`,
}));

jest.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn() },
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: any) => <div>{children}</div>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
  AlertDialogAction: ({ children, onClick, disabled }: any) => (
    <button data-testid="confirm-logout" onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div role="menuitem" onClick={onClick}>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = "/dashboard/student";
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Navbar — nav items by role", () => {
  it("renders student nav items for STUDENT role", () => {
    render(<Navbar userName="Alice" role="STUDENT" />);
    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Enroll").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Calendar").length).toBeGreaterThan(0);
  });

  it("renders lecturer nav items for LECTURER role", () => {
    render(<Navbar userName="Bob" role="LECTURER" />);
    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Create Class").length).toBeGreaterThan(0);
  });

  it("renders admin nav items for any other role", () => {
    render(<Navbar userName="Admin" role="ADMIN" />);
    expect(screen.getAllByText("Register Lecturer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Register Course").length).toBeGreaterThan(0);
  });
});

describe("Navbar — navigation", () => {
  it("navigates to the correct href when a nav item is clicked", () => {
    render(<Navbar userName="Alice" role="STUDENT" />);
    // getAllByText because nav items appear in both desktop + mobile
    fireEvent.click(screen.getAllByText("Enroll")[0]);
    expect(mockPush).toHaveBeenCalledWith("/dashboard/student/enroll");
  });

  it("navigates to /dashboard/profile when avatar is clicked", () => {
    render(<Navbar userName="Alice" role="STUDENT" />);
    const avatars = screen.getAllByAltText("Profile");
    fireEvent.click(avatars[0]);
    expect(mockPush).toHaveBeenCalledWith("/dashboard/profile");
  });
});

describe("Navbar — logout", () => {
  it("calls signOut and redirects to login on confirm", async () => {
    (authClient.authClient.signOut as jest.Mock).mockResolvedValue(undefined);
    render(<Navbar userName="Alice" role="STUDENT" />);

    const confirmButtons = screen.getAllByTestId("confirm-logout");
    fireEvent.click(confirmButtons[0]);

    await waitFor(() => {
      expect(authClient.authClient.signOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("does not call signOut when Cancel is clicked", () => {
    render(<Navbar userName="Alice" role="STUDENT" />);
    fireEvent.click(screen.getAllByText("Cancel")[0]);
    expect(authClient.authClient.signOut).not.toHaveBeenCalled();
  });
});