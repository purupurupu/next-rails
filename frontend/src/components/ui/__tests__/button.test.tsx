import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

describe("Button", () => {
  it("should render with text", () => {
    render(<Button>クリック</Button>);
    expect(screen.getByRole("button", { name: "クリック" })).toBeInTheDocument();
  });

  it("should handle click events", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>送信</Button>);
    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("should be disabled when disabled prop is set", () => {
    render(<Button disabled>無効</Button>);
    expect(screen.getByRole("button", { name: "無効" })).toBeDisabled();
  });

  it("should apply variant classes", () => {
    render(<Button variant="destructive">削除</Button>);
    const button = screen.getByRole("button", { name: "削除" });
    expect(button).toHaveClass("bg-destructive");
  });

  it("should apply size classes", () => {
    render(<Button size="sm">小さい</Button>);
    const button = screen.getByRole("button", { name: "小さい" });
    expect(button).toHaveClass("h-8");
  });

  it("should merge custom className", () => {
    render(<Button className="custom-class">カスタム</Button>);
    const button = screen.getByRole("button", { name: "カスタム" });
    expect(button).toHaveClass("custom-class");
  });
});
