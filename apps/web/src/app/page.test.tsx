import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getUniversities, sendChatMessage } from "@/lib/api";

import { demoUniversities, makeChatResponse } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

import Home from "./page";

vi.mock("@/lib/api");

describe("Home", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getUniversities).mockResolvedValue(demoUniversities);
  });

  it("renders labelled controls and loads the university list", async () => {
    renderWithProviders(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: "OpenUni" })).toBeInTheDocument();
    expect(screen.getByLabelText("University")).toBeInTheDocument();
    expect(screen.getByLabelText("What do you want to know?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask Question" })).toBeDisabled();

    expect(await screen.findByRole("option", { name: "Demo University" })).toBeInTheDocument();
  });

  it("falls back to the demo university when the list request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getUniversities).mockRejectedValue(new Error("api down"));

    renderWithProviders(<Home />);

    expect(await screen.findByRole("option", { name: "Demo University" })).toBeInTheDocument();
  });

  it("shows the api error when a chat request fails", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChatMessage).mockRejectedValue(new Error("provider unavailable"));

    renderWithProviders(<Home />);

    await user.type(screen.getByLabelText("What do you want to know?"), "When is the exam?");
    await user.click(screen.getByRole("button", { name: "Ask Question" }));

    expect(await screen.findByText("provider unavailable")).toBeInTheDocument();
  });

  it("renders a grounded answer and its sources", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChatMessage).mockResolvedValue(makeChatResponse());

    renderWithProviders(<Home />);

    await user.type(screen.getByLabelText("What do you want to know?"), "When is the exam?");
    await user.click(screen.getByRole("button", { name: "Ask Question" }));

    expect(await screen.findByRole("heading", { name: "Answer" })).toBeInTheDocument();
    expect(screen.getByText("The exam is in June.")).toBeInTheDocument();
    expect(screen.getByText("calendar.pdf")).toBeInTheDocument();
    expect(sendChatMessage).toHaveBeenCalledWith("demo", "When is the exam?");
  });
});
