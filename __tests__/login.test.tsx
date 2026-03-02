import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "@/app/login/page";
import * as authClient from "@/modules/auth/client";

jest.mock("@/modules/auth/client", () => ({
  loginWithEmail: jest.fn(),
  loginWithGoogle: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe("LoginPage", () => {
  it("calls loginWithEmail with entered credentials", async () => {
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText("example@university.edu");
    const passwordInput = screen.getByPlaceholderText(
      "Enter your password here"
    );
    const button = screen.getByText("Sign In");

    fireEvent.change(emailInput, {
      target: { value: "test@example.com" },
    });

    fireEvent.change(passwordInput, {
      target: { value: "password123" },
    });

    fireEvent.click(button);

    expect(authClient.loginWithEmail).toHaveBeenCalledWith(
      "test@example.com",
      "password123"
    );
  });
});