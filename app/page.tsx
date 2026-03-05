"use client"

import { useState, useCallback } from "react"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AppHeader } from "@/components/app-header"
import { MarkdownEditor } from "@/components/markdown-editor"
import { MarkdownPreview } from "@/components/markdown-preview"
import { exportToPdf } from "@/lib/export-pdf"
import { useIsMobile } from "@/hooks/use-mobile"

const DEFAULT_MARKDOWN = `# Welcome to MarkdownPad

A powerful markdown editor with **live preview** and one-click **PDF export**.

## Features

- **Live Preview** - See your changes in real-time as you type
- **Toolbar** - Quickly insert common markdown elements
- **PDF Export** - Export your document with one click
- **Resizable Panels** - Drag to resize editor and preview

## Markdown Syntax

### Text Formatting

You can write **bold text**, _italic text_, and ~~strikethrough text~~.

### Code

Inline \`code\` looks like this. Block code:

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Blockquotes

> "The best way to predict the future is to invent it."
> — Alan Kay

### Tables

| Feature | Status |
| ------- | ------ |
| Editor  | Done   |
| Preview | Done   |
| PDF     | Done   |

### Lists

1. First ordered item
2. Second ordered item
3. Third ordered item

---

Start editing to see the magic happen!
`

export default function Page() {
  const [content, setContent] = useState(DEFAULT_MARKDOWN)
  const [isExporting, setIsExporting] = useState(false)
  const isMobile = useIsMobile()

  const handleExportPdf = useCallback(async () => {
    if (!content.trim()) return
    setIsExporting(true)
    try {
      await exportToPdf(content, "markdown-document")
    } catch (error) {
      console.error("Failed to export PDF:", error)
    } finally {
      setIsExporting(false)
    }
  }, [content])

  const handleClear = useCallback(() => {
    setContent("")
  }, [])

  return (
    <div className="flex flex-col h-dvh bg-background">
      <AppHeader
        content={content}
        onExportPdf={handleExportPdf}
        onClear={handleClear}
        isExporting={isExporting}
      />

      {isMobile ? (
        <Tabs defaultValue="editor" className="flex flex-col flex-1 min-h-0">
          <div className="px-2 pt-2 bg-background">
            <TabsList className="w-full bg-muted">
              <TabsTrigger value="editor" className="flex-1">
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1">
                Preview
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="editor" className="flex-1 min-h-0 m-0 p-0">
            <div className="h-full border-t border-border">
              <MarkdownEditor content={content} onChange={setContent} />
            </div>
          </TabsContent>
          <TabsContent value="preview" className="flex-1 min-h-0 m-0 p-0">
            <div className="h-full overflow-auto border-t border-border bg-card p-6">
              <MarkdownPreview content={content} />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="px-4 py-2 border-b border-border bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Editor
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <MarkdownEditor content={content} onChange={setContent} />
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="px-4 py-2 border-b border-border bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Preview
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-auto bg-card p-6">
                <MarkdownPreview content={content} />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  )
}
