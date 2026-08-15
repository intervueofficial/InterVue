import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Loader2Icon,
  PlayIcon,
  CheckCircle2Icon,
  RotateCcwIcon,
  CopyIcon,
  CheckIcon,
  ZoomInIcon,
  ZoomOutIcon,
  WrapTextIcon,
  Maximize2Icon,
  Minimize2Icon,
  WandSparklesIcon,
} from "lucide-react";
import { LANGUAGE_CONFIG } from "../data/languageConfig";

function ToolbarButton({ onClick, disabled, title, active, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "bg-blue-50 text-blue-600"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function CodeEditorPanel({
  selectedLanguage,
  code,
  isRunning,
  onLanguageChange,
  onCodeChange,
  onRunCode,
  onSubmitForGrading,
  isGrading,
  gradingResult,
  showGrading = false,
  starterCode = "",
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const [fontSize, setFontSize] = useState(16);
  const [wordWrap, setWordWrap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const busy = isRunning || isGrading;

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });

    // Quick keyboard shortcuts — a small but real productivity boost,
    // matching what candidates already expect from a real IDE.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunCode?.();
    });

    if (showGrading) {
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
        () => {
          onSubmitForGrading?.();
        }
      );
    }
  };

  const handleFormat = () => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail silently (permissions, insecure
      // context) — not worth surfacing an error for a copy button.
    }
  };

  const handleReset = () => {
    if (!starterCode) return;
    const confirmed = window.confirm(
      "Reset to the starter code? This will discard your current changes."
    );
    if (confirmed) onCodeChange?.(starterCode);
  };

  return (
    <div
      className={`bg-white flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50" : "h-full"
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={LANGUAGE_CONFIG[selectedLanguage].icon}
            alt={LANGUAGE_CONFIG[selectedLanguage].name}
            className="size-6 shrink-0"
          />
          <select
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedLanguage}
            onChange={onLanguageChange}
            disabled={busy}
          >
            {Object.entries(LANGUAGE_CONFIG).map(([key, lang]) => (
              <option key={key} value={key}>
                {lang.name}
              </option>
            ))}
          </select>

          <div className="hidden md:flex items-center gap-0.5 pl-1 ml-1 border-l border-gray-200">
            <ToolbarButton
              onClick={handleFormat}
              disabled={busy}
              title="Format code"
            >
              <WandSparklesIcon className="size-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={handleReset}
              disabled={busy || !starterCode}
              title={starterCode ? "Reset to starter code" : "No starter code for this problem"}
            >
              <RotateCcwIcon className="size-4" />
            </ToolbarButton>

            <ToolbarButton onClick={handleCopy} title="Copy code">
              {copied ? (
                <CheckIcon className="size-4 text-green-600" />
              ) : (
                <CopyIcon className="size-4" />
              )}
            </ToolbarButton>

            <div className="w-px h-5 bg-gray-200 mx-0.5" />

            <ToolbarButton
              onClick={() => setFontSize((s) => Math.max(11, s - 1))}
              title="Decrease font size"
            >
              <ZoomOutIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setFontSize((s) => Math.min(24, s + 1))}
              title="Increase font size"
            >
              <ZoomInIcon className="size-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => setWordWrap((w) => !w)}
              title="Toggle word wrap"
              active={wordWrap}
            >
              <WrapTextIcon className="size-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => setIsFullscreen((f) => !f)}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2Icon className="size-4" />
              ) : (
                <Maximize2Icon className="size-4" />
              )}
            </ToolbarButton>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showGrading && gradingResult && (
            <span
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold ${
                gradingResult.passed === gradingResult.total
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <CheckCircle2Icon className="size-3.5" />
              {gradingResult.passed}/{gradingResult.total} tests passed
            </span>
          )}

          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            disabled={busy}
            onClick={onRunCode}
            title="Run code (Ctrl/⌘ + Enter)"
          >
            {isRunning ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayIcon className="size-4" />
                Run Code
              </>
            )}
          </button>

          {showGrading && (
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              disabled={busy}
              onClick={onSubmitForGrading}
              title="Submit for grading (Ctrl/⌘ + Shift + Enter)"
            >
              {isGrading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="size-4" />
                  Submit for Grading
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height={"100%"}
          language={LANGUAGE_CONFIG[selectedLanguage].monacoLang}
          value={code}
          onChange={onCodeChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            minimap: { enabled: false },
            wordWrap: wordWrap ? "on" : "off",
            padding: { top: 12 },
            tabSize: 2,
            cursorBlinking: "smooth",
            smoothScrolling: true,
            renderLineHighlight: "gutter",
          }}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 text-[11px] text-gray-500 bg-gray-50 border-t border-gray-200 select-none">
        <div className="flex items-center gap-3">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="hidden sm:inline">
            {(code || "").split("\n").length} lines
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">
            {busy ? "Ctrl/⌘ + Enter to run" : "Ready"}
          </span>
          <span className="font-medium text-gray-700">
            {LANGUAGE_CONFIG[selectedLanguage].name}
          </span>
        </div>
      </div>
    </div>
  );
}
export default CodeEditorPanel;