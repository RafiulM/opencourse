"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

interface MarkdownPreviewerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  editorClassName?: string
  previewClassName?: string
  disabled?: boolean
  debounceMs?: number
}

export function MarkdownPreviewer({
  value = "",
  onChange,
  placeholder = "Enter markdown content here...",
  className,
  editorClassName,
  previewClassName,
  disabled = false,
  debounceMs = 300,
}: MarkdownPreviewerProps) {
  const [markdownContent, setMarkdownContent] = React.useState(value)
  const [isEditing, setIsEditing] = React.useState(false)

  // Debounced value for performance optimization
  const debouncedContent = React.useMemo(() => {
    const handler = setTimeout(() => {
      if (markdownContent !== value) {
        onChange?.(markdownContent)
      }
    }, debounceMs)

    return () => clearTimeout(handler)
  }, [markdownContent, onChange, debounceMs])

  React.useEffect(() => {
    debouncedContent
    return debouncedContent
  }, [debouncedContent])

  // Update local state when prop value changes
  React.useEffect(() => {
    setMarkdownContent(value)
  }, [value])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setMarkdownContent(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle common keyboard shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      // Could add text formatting logic here
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      // Could add text formatting logic here
    }
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-2 gap-4 h-full",
        className
      )}
    >
      {/* Editor Panel */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Editor</h3>
          <span className="text-xs text-muted-foreground">Markdown</span>
        </div>
        <Textarea
          value={markdownContent}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "min-h-[400px] resize-none font-mono text-sm",
            isEditing && "ring-2 ring-ring/50",
            editorClassName
          )}
          aria-label="Markdown editor"
          spellCheck={false}
        />
      </div>

      {/* Preview Panel */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Preview</h3>
          <span className="text-xs text-muted-foreground">Rendered</span>
        </div>
        <div
          className={cn(
            "min-h-[400px] p-4 border rounded-md bg-background overflow-auto",
            "prose prose-sm max-w-none dark:prose-invert",
            "prose-headings:font-semibold prose-headings:text-foreground",
            "prose-p:text-foreground prose-p:leading-relaxed",
            "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono",
            "prose-pre:bg-muted prose-pre:border prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto",
            "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic",
            "prose-hr:border-border prose-hr:my-4",
            "prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6",
            "prose-li:my-1 prose-a:text-primary prose-a:underline hover:prose-a:no-underline",
            "prose-table:border-border prose-table:border prose-table:w-full",
            "prose-th:border-border prose-th:border prose-th:px-4 prose-th:py-2 prose-th:bg-muted prose-th:font-semibold",
            "prose-td:border-border prose-td:border prose-td:px-4 prose-td:py-2",
            previewClassName
          )}
          role="region"
          aria-label="Markdown preview"
        >
          {markdownContent ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                // Custom components for better styling if needed
                h1: ({ children, ...props }) => (
                  <h1 className="text-2xl font-bold mt-6 mb-4" {...props}>
                    {children}
                  </h1>
                ),
                h2: ({ children, ...props }) => (
                  <h2 className="text-xl font-semibold mt-5 mb-3" {...props}>
                    {children}
                  </h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3 className="text-lg font-semibold mt-4 mb-2" {...props}>
                    {children}
                  </h3>
                ),
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          ) : (
            <div className="text-muted-foreground italic">
              Nothing to preview. Start typing in the editor...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}