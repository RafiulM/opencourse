"use client"

import {
  Bold,
  Code,
  Heading,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
} from "lucide-react"
import { useCallback, useMemo, useRef, useState } from "react"
import type { ComponentType, KeyboardEvent } from "react"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

const textareaBaseClasses = "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 h-full min-h-[320px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"

type MarkdownEditorProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

type EditorView = "edit" | "split" | "preview"

type ToolbarAction = {
  label: string
  icon: ComponentType<{ className?: string }>
  onClick: () => void
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  className,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [view, setView] = useState<EditorView>("split")

  const setSelection = useCallback((start: number, end: number) => {
    const textarea = textareaRef.current
    if (!textarea) return
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start, end)
    })
  }, [])

  const wrapSelection = useCallback(
    (prefix: string, suffix: string, placeholderText?: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentValue = textarea.value
      const selectedText = currentValue.slice(start, end)
      const text = selectedText || placeholderText || ""

      const nextValue =
        currentValue.slice(0, start) +
        prefix +
        text +
        suffix +
        currentValue.slice(end)

      onChange(nextValue)
      const cursorStart = start + prefix.length
      const cursorEnd = cursorStart + text.length
      setSelection(cursorStart, cursorEnd)
    },
    [onChange, setSelection]
  )

  const toggleLinePrefix = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const { selectionStart, selectionEnd, value: currentValue } = textarea
      const lineStart = currentValue.lastIndexOf("\n", selectionStart - 1) + 1
      const lineEndRaw = currentValue.indexOf("\n", selectionEnd)
      const lineEnd = lineEndRaw === -1 ? currentValue.length : lineEndRaw
      const selectedPortion = currentValue.slice(lineStart, lineEnd)

      const lines = selectedPortion.length > 0 ? selectedPortion.split("\n") : [""]
      const hasContent = lines.some((line) => line.trim().length > 0)
      const allPrefixed =
        hasContent &&
        lines.every((line) =>
          line.trim().length === 0 ? true : line.startsWith(prefix)
        )

      const updatedLines = lines.map((line) => {
        if (line.trim().length === 0) {
          if (!allPrefixed && prefix) {
            return prefix
          }
          return line
        }
        if (allPrefixed) {
          return line.startsWith(prefix) ? line.slice(prefix.length) : line
        }
        return `${prefix}${line}`
      })

      const nextValue =
        currentValue.slice(0, lineStart) +
        updatedLines.join("\n") +
        currentValue.slice(lineEnd)

      onChange(nextValue)
      setSelection(lineStart, lineStart + updatedLines.join("\n").length)
    },
    [onChange, setSelection]
  )

  const insertBlock = useCallback(
    (blockWrapper: { before: string; after: string }, placeholderText?: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentValue = textarea.value
      const selectedText = currentValue.slice(start, end)
      const text = selectedText || placeholderText || ""
      const blockText = `${blockWrapper.before}\n${text}\n${blockWrapper.after}`

      const nextValue =
        currentValue.slice(0, start) +
        blockText +
        currentValue.slice(end)

      onChange(nextValue)
      const cursorStart = start + blockWrapper.before.length + 1
      const cursorEnd = cursorStart + text.length
      setSelection(cursorStart, cursorEnd)
    },
    [onChange, setSelection]
  )

  const toolbarActions: ToolbarAction[] = useMemo(
    () => [
      {
        label: "Bold",
        icon: Bold,
        onClick: () => wrapSelection("**", "**", "bold text"),
      },
      {
        label: "Italic",
        icon: Italic,
        onClick: () => wrapSelection("_", "_", "italic text"),
      },
      {
        label: "Inline code",
        icon: Code,
        onClick: () => wrapSelection("`", "`", "code"),
      },
      {
        label: "Heading",
        icon: Heading,
        onClick: () => toggleLinePrefix("# "),
      },
      {
        label: "Quote",
        icon: Quote,
        onClick: () => toggleLinePrefix("> "),
      },
      {
        label: "Bullet list",
        icon: List,
        onClick: () => toggleLinePrefix("- "),
      },
      {
        label: "Numbered list",
        icon: ListOrdered,
        onClick: () => toggleLinePrefix("1. "),
      },
      {
        label: "Code block",
        icon: Code,
        onClick: () =>
          insertBlock({ before: "```", after: "```" }, "console.log('Hello world')"),
      },
      {
        label: "Link",
        icon: LinkIcon,
        onClick: () => wrapSelection("[", "](#)", "link text"),
      },
      {
        label: "Image",
        icon: ImageIcon,
        onClick: () => wrapSelection("![", "](#)", "alt text"),
      },
    ],
    [insertBlock, toggleLinePrefix, wrapSelection]
  )

  const handleShortcut = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      const isMod = event.metaKey || event.ctrlKey
      if (!isMod) return

      const key = event.key.toLowerCase()
      const comboKey = `${event.shiftKey ? "shift+" : ""}${key}`

      const handlers: Record<string, () => void> = {
        b: () => wrapSelection("**", "**", "bold text"),
        i: () => wrapSelection("_", "_", "italic text"),
        e: () => wrapSelection("`", "`", "code"),
        k: () => wrapSelection("[", "](#)", "link text"),
        "shift+h": () => toggleLinePrefix("# "),
        "shift+q": () => toggleLinePrefix("> "),
        "shift+l": () => toggleLinePrefix("- "),
        "shift+o": () => toggleLinePrefix("1. "),
        "shift+c": () =>
          insertBlock({ before: "```", after: "```" }, "console.log('Hello world')"),
        "shift+i": () => wrapSelection("![", "](#)", "alt text"),
      }

      const handler = handlers[comboKey] || handlers[key]
      if (handler) {
        event.preventDefault()
        handler()
      }
    },
    [insertBlock, toggleLinePrefix, wrapSelection]
  )

  const renderTextarea = (
    <textarea
      id={id}
      ref={textareaRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={textareaBaseClasses}
      onKeyDown={handleShortcut}
    />
  )

  const renderPreview = (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {value.trim() ? (
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{value}</ReactMarkdown>
      ) : (
        <p className="text-muted-foreground">Start writing to see the live preview.</p>
      )}
    </div>
  )

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-1">
          {toolbarActions.map(({ label, icon: Icon, onClick }) => (
            <Button
              key={label}
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClick}
              className="h-8 w-8 p-0"
              title={label}
            >
              <Icon className="h-4 w-4" />
              <span className="sr-only">{label}</span>
            </Button>
          ))}
        </div>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(nextView) => {
            if (nextView) setView(nextView as EditorView)
          }}
          variant="outline"
          size="sm"
          className="flex-none rounded-md self-start md:self-auto"
        >
          <ToggleGroupItem value="edit" className="flex-none px-3">
            Edit
          </ToggleGroupItem>
          <ToggleGroupItem value="split" className="flex-none px-3">
            Split
          </ToggleGroupItem>
          <ToggleGroupItem value="preview" className="flex-none px-3">
            Preview
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="border-border bg-card flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-md border">
        {view === "edit" && <div className="flex-1 p-4">{renderTextarea}</div>}
        {view === "preview" && <div className="flex-1 overflow-auto p-6">{renderPreview}</div>}
        {view === "split" && (
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full border-r border-border/80 p-4">
                {renderTextarea}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full overflow-y-auto p-6">{renderPreview}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  )
}
