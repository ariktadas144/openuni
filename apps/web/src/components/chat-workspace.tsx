"use client";

import { useState, useEffect } from "react";
import { sendChatMessage, ChatResponse, getUniversities } from "@/lib/api";

function AnswerText({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  if (paragraphs.length === 0) {
    return <p className="answer-empty">The API returned an empty answer.</p>;
  }

  return (
    <div className="answer-text" data-testid="answer-text">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}

export function ChatWorkspace() {
  const [universities, setUniversities] = useState<{ slug: string; name: string }[]>([]);
  const [university, setUniversity] = useState("demo");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ChatResponse | null>(null);

  // Load universities on component mount
  useEffect(() => {
    async function loadUniversities() {
      try {
        const data = await getUniversities();
        setUniversities(data);
        // Set first university as default if available
        if (data.length > 0) {
          setUniversity(data[0].slug);
        }
      } catch (err) {
        console.error("Failed to load universities:", err);
        // Fallback to demo
        setUniversities([{ slug: "demo", name: "Demo University" }]);
      }
    }
    loadUniversities();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const data = await sendChatMessage(university, question);
      setResponse(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="container" tabIndex={-1}>
      <header className="header">
        <h1>OpenUni</h1>
        <p>Ask questions about any university and get cited answers.</p>
      </header>

      <form className="search-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="university">University</label>
          <select
            id="university"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            disabled={loading}
          >
            {universities.map((uni) => (
              <option key={uni.slug} value={uni.slug}>
                {uni.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="question">What do you want to know?</label>
          <input
            type="text"
            id="question"
            placeholder="e.g. What are the admission requirements for Computer Science?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading || !question.trim()}>
          {loading ? "Searching..." : "Ask Question"}
        </button>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
      </form>

      {loading && (
        <div className="loading-container" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true"></div>
          <p>Analyzing university documents...</p>
        </div>
      )}

      {response && !loading && (
        <section
          className="results-container"
          aria-labelledby="answer-heading"
          aria-live="polite"
        >
          <article className="answer-card">
            <div className="answer-header">
              <h2 id="answer-heading">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Answer
              </h2>
              <span className="answer-source-count">
                {response.sources.length === 0
                  ? "No sources cited"
                  : `${response.sources.length} source${response.sources.length === 1 ? "" : "s"} cited`}
              </span>
            </div>
            <AnswerText text={response.answer} />
          </article>

          <section className="sources-section" aria-labelledby="sources-heading">
            <h3 id="sources-heading">
              Sources <span className="source-count">{response.sources.length}</span>
            </h3>
            {response.sources.length === 0 ? (
              <p className="sources-empty">
                No supporting sources were returned for this answer.
              </p>
            ) : (
              <ol className="sources-list">
                {response.sources.map((source, index) => (
                  <li className="source-card" key={`${source.source}-${index}`}>
                    <div className="source-meta">
                      <span className="source-index" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className="source-title">{source.source || "Unknown source"}</span>
                    </div>
                    <blockquote className="source-snippet">{source.text_snippet}</blockquote>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </section>
      )}
    </main>
  );
}
