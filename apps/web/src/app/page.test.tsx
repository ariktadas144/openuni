import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getUniversities, sendChatMessage } from "@/lib/api";

import { ChatWorkspace } from "@/components/chat-workspace";
import { demoUniversities, makeChatResponse } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

vi.mock("@/lib/api");

describe("ChatWorkspace", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getUniversities).mockResolvedValue(demoUniversities);
  });

  it("renders labelled controls and loads the university list", async () => {
    renderWithProviders(<ChatWorkspace />);

    expect(screen.getByRole("heading", { level: 1, name: "OpenUni" })).toBeInTheDocument();
    expect(screen.getByLabelText("University")).toBeInTheDocument();
    expect(screen.getByLabelText("What do you want to know?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask Question" })).toBeDisabled();

    expect(await screen.findByRole("option", { name: "Demo University" })).toBeInTheDocument();
  });

  it("falls back to the demo university when the list request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getUniversities).mockRejectedValue(new Error("api down"));

    renderWithProviders(<ChatWorkspace />);

    expect(await screen.findByRole("option", { name: "Demo University" })).toBeInTheDocument();
  });

  it("shows the api error when a chat request fails", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChatMessage).mockRejectedValue(new Error("provider unavailable"));

    renderWithProviders(<ChatWorkspace />);

    await user.type(screen.getByLabelText("What do you want to know?"), "When is the exam?");
    await user.click(screen.getByRole("button", { name: "Ask Question" }));

    expect(await screen.findByText("provider unavailable")).toBeInTheDocument();
  });

  it("renders a grounded answer and its sources", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChatMessage).mockResolvedValue(makeChatResponse());

    renderWithProviders(<ChatWorkspace />);

    await user.type(screen.getByLabelText("What do you want to know?"), "When is the exam?");
    await user.click(screen.getByRole("button", { name: "Ask Question" }));

    expect(await screen.findByRole("heading", { name: "Answer" })).toBeInTheDocument();
    expect(screen.getByText("The exam is in June.")).toBeInTheDocument();
    expect(screen.getByText("calendar.pdf")).toBeInTheDocument();
    expect(screen.getByText("1 source cited")).toBeInTheDocument();
    expect(sendChatMessage).toHaveBeenCalledWith("demo", "When is the exam?");
  });

  it("renders answers as text, preserving newlines without injecting HTML", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChatMessage).mockResolvedValue(
      makeChatResponse({
        answer:
          "Use <strong>official</strong> sources.\nKeep this on the same line.\n\nSecond paragraph.",
        sources: [],
      })
    );

    renderWithProviders(<ChatWorkspace />);

    await user.type(screen.getByLabelText("What do you want to know?"), "Where do I check?");
    await user.click(screen.getByRole("button", { name: "Ask Question" }));

    const answer = await screen.findByTestId("answer-text");
    expect(answer.querySelector("strong")).toBeNull();

    const paragraphs = answer.querySelectorAll("p");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].textContent).toBe(
      "Use <strong>official</strong> sources.\nKeep this on the same line."
    );
    expect(paragraphs[1].textContent).toBe("Second paragraph.");
  });

  it("shows an explicit empty state when no sources are returned", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChatMessage).mockResolvedValue(makeChatResponse({ sources: [] }));

    renderWithProviders(<ChatWorkspace />);

    await user.type(screen.getByLabelText("What do you want to know?"), "When is the exam?");
    await user.click(screen.getByRole("button", { name: "Ask Question" }));

    expect(
      await screen.findByText("No supporting sources were returned for this answer.")
    ).toBeInTheDocument();
    expect(screen.getByText("No sources cited")).toBeInTheDocument();
  });

  it("renders every source without inventing external links", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChatMessage).mockResolvedValue(
      makeChatResponse({
        sources: [
          { text_snippet: "Exams run in June.", source: "calendar.pdf" },
          { text_snippet: "Deadlines are in May.", source: "deadlines.pdf" },
        ],
      })
    );

    renderWithProviders(<ChatWorkspace />);

    await user.type(screen.getByLabelText("What do you want to know?"), "When is the exam?");
    await user.click(screen.getByRole("button", { name: "Ask Question" }));

    expect(await screen.findByText("calendar.pdf")).toBeInTheDocument();
    expect(screen.getByText("deadlines.pdf")).toBeInTheDocument();
    expect(screen.getByText("Exams run in June.")).toBeInTheDocument();
    expect(screen.getByText("Deadlines are in May.")).toBeInTheDocument();
    expect(screen.getByText("2 sources cited")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "calendar.pdf" })).not.toBeInTheDocument();
  });
});
