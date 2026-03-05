"use client";

import { useMemo } from "react";
import { marked } from "marked";
import createDOMPurify from "dompurify";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({
  content,
  className = "",
}: MarkdownPreviewProps) {
  const htmlContent = useMemo(() => {
    if (!content.trim()) return "";
    if (typeof window === "undefined") return "";

    const rawHtml = marked.parse(content, {
      breaks: true,
      gfm: true,
    }) as string;
    const purify = createDOMPurify(window);
    return purify.sanitize(rawHtml);
  }, [content]);

  if (!content.trim()) {
    return (
      <div
        className={`flex items-center justify-center h-full text-muted-foreground ${className}`}
      >
        <p className="text-center">
          Start typing in the editor to see a live preview here...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`markdown-preview ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
