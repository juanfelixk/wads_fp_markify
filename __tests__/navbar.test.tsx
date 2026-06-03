import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Navbar from "@/components/dashboard/navbar";
import * as authClient from "@/services/auth/client";
import React from "react";

const mockPush = jest.fn();
let mockPathname = "/dashboard/student";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

jest.mock("@/services/auth/client", () => ({
  authClient: { signOut: jest.fn() },
}));

jest.mock("@/lib/avatar", () => ({
  getAvatarUrl: (name: string) => `https://avatar.example.com/${name}`,
}));

jest.mock("@/lib/utils", () => ({
  cn: (...args: (string | undefined | null | boolean)[]) => args.filter(Boolean).join(" "),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn() },
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  AlertDialogAction: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button data-testid="confirm-logout" onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <div role="menuitem" onClick={onClick}>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = "/dashboard/student";
});

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