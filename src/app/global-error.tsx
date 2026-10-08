"use client";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8f5ed", color: "#18241f", fontFamily: "system-ui, sans-serif" }}>
        <title>Something went wrong | Shohay</title>
        <main style={{ maxWidth: 480, padding: 32, textAlign: "center" }}>
          <h1 style={{ fontFamily: "Georgia, serif", color: "#174335", fontSize: 36 }}>Shohay is having trouble.</h1>
          <p style={{ lineHeight: 1.6, opacity: 0.65 }}>Please try again in a moment.{error.digest ? ` Reference: ${error.digest}` : ""}</p>
          <button onClick={() => retry()} style={{ marginTop: 16, padding: "12px 22px", borderRadius: 999, border: 0, background: "#174335", color: "white", fontWeight: 700, cursor: "pointer" }}>Try again</button>
        </main>
      </body>
    </html>
  );
}
