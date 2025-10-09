import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import mermaid from "mermaid";
import "katex/dist/katex.min.css";
import "highlight.js/styles/atom-one-dark.css";

// 多语言配置
const languages = {
  "zh-CN": {
    title: "Markdown 编辑器",
    editor: "编辑器",
    preview: "预览",
    markdownSyntax: "Markdown 语法",
    export: "导出",
    clear: "清空",
    showLineNumbers: "显示行号",
    hideLineNumbers: "隐藏行号",
    showShortcuts: "显示快捷键",
    hideShortcuts: "隐藏快捷键",
    tools: "工具",
    collapse: "收起",
    editMode: "编辑模式",
    previewMode: "预览模式",
    swipeToSwitch: "滑动切换",
    mobileMode: "移动端模式",
    words: "词",
    insertChart: "插入图表",
    sequenceDiagram: "时序图",
    flowchart: "流程图",
    selectLanguage: "选择语言",
    mermaidChart: "Mermaid 图表",
    confirmClear: "确定要清空文档吗？此操作不可撤销。",
    exportSuccess: "导出成功",
    copySuccess: "复制成功",
    copyError: "复制失败",
  },
  "en-US": {
    title: "Markdown Editor",
    editor: "Editor",
    preview: "Preview",
    markdownSyntax: "Markdown Syntax",
    export: "Export",
    clear: "Clear",
    showLineNumbers: "Show Line Numbers",
    hideLineNumbers: "Hide Line Numbers",
    showShortcuts: "Show Shortcuts",
    hideShortcuts: "Hide Shortcuts",
    tools: "Tools",
    collapse: "Collapse",
    editMode: "Edit Mode",
    previewMode: "Preview Mode",
    swipeToSwitch: "Swipe to Switch",
    mobileMode: "Mobile Mode",
    words: "words",
    insertChart: "Insert Chart",
    sequenceDiagram: "Sequence Diagram",
    flowchart: "Flowchart",
    selectLanguage: "Select Language",
    mermaidChart: "Mermaid Chart",
    confirmClear:
      "Are you sure you want to clear the document? This action cannot be undone.",
    exportSuccess: "Export successful",
    copySuccess: "Copy successful",
    copyError: "Copy failed",
  },
  "ja-JP": {
    title: "Markdown エディター",
    editor: "エディター",
    preview: "プレビュー",
    markdownSyntax: "Markdown 構文",
    export: "エクスポート",
    clear: "クリア",
    showLineNumbers: "行番号を表示",
    hideLineNumbers: "行番号を非表示",
    showShortcuts: "ショートカットを表示",
    hideShortcuts: "ショートカットを非表示",
    tools: "ツール",
    collapse: "折りたたむ",
    editMode: "編集モード",
    previewMode: "プレビューモード",
    swipeToSwitch: "スワイプで切り替え",
    mobileMode: "モバイルモード",
    words: "語",
    insertChart: "チャートを挿入",
    sequenceDiagram: "シーケンス図",
    flowchart: "フローチャート",
    selectLanguage: "言語を選択",
    mermaidChart: "Mermaid チャート",
    confirmClear: "ドキュメントをクリアしますか？この操作は元に戻せません。",
    exportSuccess: "エクスポート成功",
    copySuccess: "コピー成功",
    copyError: "コピー失敗",
  },
  "ko-KR": {
    title: "Markdown 에디터",
    editor: "에디터",
    preview: "미리보기",
    markdownSyntax: "Markdown 문법",
    export: "내보내기",
    clear: "지우기",
    showLineNumbers: "줄 번호 표시",
    hideLineNumbers: "줄 번号 숨기기",
    showShortcuts: "단축키 표시",
    hideShortcuts: "단축키 숨기기",
    tools: "도구",
    collapse: "접기",
    editMode: "편집 모드",
    previewMode: "미리보기 모드",
    swipeToSwitch: "스와이프로 전환",
    mobileMode: "모바일 모드",
    words: "단어",
    insertChart: "차트 삽입",
    sequenceDiagram: "시퀀스 다이어그램",
    flowchart: "플로우차트",
    selectLanguage: "언어 선택",
    mermaidChart: "Mermaid 차트",
    confirmClear: "문서를 지우시겠습니까? 이 작업은 취소할 수 없습니다.",
    exportSuccess: "내보내기 성공",
    copySuccess: "복사 성공",
    copyError: "복사 실패",
  },
};

const MarkDownEditor = () => {
  const [content, setContent] = useState("");
  const [splitPosition, setSplitPosition] = useState(50);
  const [wordCount, setWordCount] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState("editor");
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en-US");

  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const containerRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startWidth: 50,
  });

  const lineNumbersCache = useRef({
    count: 0,
    elements: [],
  });

  const t = languages[currentLanguage];

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      const isSmallScreen = window.matchMedia("(max-width: 900px)").matches;
      const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const isUA =
        /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          navigator.userAgent.toLowerCase()
        );
      const isMobile = isSmallScreen || isCoarsePointer || isUA;
      setIsMobile(isMobile);
      if (isMobile) {
        setSplitPosition(100);
      } else {
        setSplitPosition(50);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 初始化示例内容
  useEffect(() => {
    const savedContent = localStorage.getItem("md-content");
    if (savedContent) {
      setContent(savedContent);
    } else {
      setContent(`
`);
    }
  }, [currentLanguage, t.title, t.sequenceDiagram]);

  // 初始化 Mermaid
  // useEffect(() => {
  //   mermaid.initialize({
  //     startOnLoad: true,
  //     theme: "dark",
  //     securityLevel: "loose",
  //     flowchart: {
  //       useMaxWidth: true,
  //       htmlLabels: true,
  //     },
  //     sequence: {
  //       useMaxWidth: true,
  //     },
  //   });
  // }, []);

  // 自动保存
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem("md-content", content);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [content]);

  // 字数统计
  useEffect(() => {
    const text = content.replace(/[#*`\-[\]()!\\]/g, "").trim();
    const words = text
      ? text.split(/\s+/).filter((word) => word.length > 0).length
      : 0;
    setWordCount(words);
  }, [content]);

  // 行号
  useEffect(() => {
    if (!showLineNumbers || !lineNumbersRef.current || isMobile) return;

    const lines = content.split("\n");
    const lineCount = lines.length;

    if (
      lineCount === lineNumbersCache.current.count &&
      lineNumbersRef.current.innerHTML
    )
      return;

    lineNumbersCache.current.count = lineCount;

    const fragment = document.createDocumentFragment();

    for (let i = 1; i <= lineCount; i++) {
      const lineDiv = document.createElement("div");
      lineDiv.className =
        "text-right pr-3 text-gray-500 text-sm select-none hover:text-gray-300 transition-colors";
      lineDiv.style.height = "1.75rem";
      lineDiv.style.lineHeight = "1.75rem";
      lineDiv.textContent = i.toString();
      fragment.appendChild(lineDiv);
    }

    lineNumbersRef.current.innerHTML = "";
    lineNumbersRef.current.appendChild(fragment);
  }, [content, showLineNumbers, isMobile]);

  // 同步滚动
  const handleEditorScroll = useCallback(() => {
    if (!editorRef.current || !previewRef.current || isMobile) return;

    requestAnimationFrame(() => {
      const editor = editorRef.current;
      const preview = previewRef.current;

      const ratio =
        editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
      preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);

      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = editor.scrollTop;
      }
    });
  }, [isMobile]);

  // 高性能拖拽实现（仅桌面端）
  const handleSplitterMouseDown = (e) => {
    if (isMobile) return;

    e.preventDefault();
    dragState.current = {
      isDragging: true,
      startX: e.clientX,
      startWidth: splitPosition,
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  };

  const handleMouseMove = (e) => {
    if (!dragState.current.isDragging || !containerRef.current || isMobile)
      return;

    requestAnimationFrame(() => {
      const container = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragState.current.startX;
      const deltaPercent = (deltaX / container.width) * 100;

      const newPosition = dragState.current.startWidth + deltaPercent;
      const clampedPosition = Math.max(20, Math.min(80, newPosition));

      setSplitPosition(clampedPosition);
    });
  };

  const handleMouseUp = () => {
    if (isMobile) return;

    dragState.current.isDragging = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  // 插入格式
  const insertFormat = (before, after = "") => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // 导出功能
  const exportMarkdown = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
    alert(t.exportSuccess);
  };

  // 清空文档
  const clearDocument = () => {
    if (window.confirm(t.confirmClear)) {
      setContent("");
      localStorage.removeItem("md-content");
    }
  };

  // 插入代码块
  const insertCodeBlock = (language = "") => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const codeBlock = selectedText
      ? `\`\`\`${language}\n${selectedText}\n\`\`\``
      : `\`\`\`${language}\n${getCodeComment(
          "placeholder",
          currentLanguage
        )}\n\`\`\``;

    const newText =
      content.substring(0, start) + codeBlock + content.substring(end);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + codeBlock.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // 插入 Mermaid 图表
  const insertMermaid = (type = "sequence") => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const mermaidTemplate =
      type === "sequence"
        ? `\`\`\`mermaid
sequenceDiagram
    participant A as ${getParticipantName("user", currentLanguage)}
    participant B as ${getParticipantName("system", currentLanguage)}
    
    A->>B: ${getActionName("request", currentLanguage)}
    B-->>A: ${getActionName("response", currentLanguage)}
\`\`\``
        : `\`\`\`mermaid
flowchart TD
    A[${getFlowchartNode("start", currentLanguage)}] --> B[${getFlowchartNode(
            "process",
            currentLanguage
          )}]
    B --> C[${getFlowchartNode("end", currentLanguage)}]
\`\`\``;

    const newText =
      content.substring(0, start) +
      "\n" +
      mermaidTemplate +
      "\n" +
      content.substring(start);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + mermaidTemplate.length + 2;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // 插入标题
  const insertHeading = (level) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const hashes = "#".repeat(level);
    const heading = selectedText
      ? `\n${hashes} ${selectedText}\n`
      : `\n${hashes} ${getHeadingText(level, currentLanguage)}\n`;

    const newText =
      content.substring(0, start) + heading + content.substring(end);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + heading.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // 插入列表
  const insertList = (type = "unordered") => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const prefix = type === "unordered" ? "- " : "1. ";
    const listItem = selectedText
      ? `\n${prefix}${selectedText}`
      : `\n${prefix}${getListItemText(currentLanguage)}`;

    const newText =
      content.substring(0, start) + listItem + content.substring(end);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + listItem.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // 工具栏配置
  const toolbarItems = [
    {
      icon: "H1",
      title: `${getHeadingText(1, currentLanguage)}`,
      action: () => insertHeading(1),
      shortcut: "# ",
    },
    {
      icon: "H2",
      title: `${getHeadingText(2, currentLanguage)}`,
      action: () => insertHeading(2),
      shortcut: "## ",
    },
    {
      icon: "H3",
      title: `${getHeadingText(3, currentLanguage)}`,
      action: () => insertHeading(3),
      shortcut: "### ",
    },
    {
      icon: "•",
      title: `${getListText("unordered", currentLanguage)}`,
      action: () => insertList("unordered"),
      shortcut: "- ",
    },
    {
      icon: "1.",
      title: `${getListText("ordered", currentLanguage)}`,
      action: () => insertList("ordered"),
      shortcut: "1. ",
    },
    {
      icon: "B",
      title: `${getFormatText("bold", currentLanguage)}`,
      action: () => insertFormat("**", "**"),
      shortcut: "**",
    },
    {
      icon: "I",
      title: `${getFormatText("italic", currentLanguage)}`,
      action: () => insertFormat("*", "*"),
      shortcut: "*",
    },
    {
      icon: "{}",
      title: `${getFormatText("code", currentLanguage)}`,
      action: () => insertFormat("`", "`"),
      shortcut: "`",
    },
    {
      icon: "🔗",
      title: `${getFormatText("link", currentLanguage)}`,
      action: () => insertFormat("[", "](url)"),
      shortcut: "[]()",
    },
    {
      icon: "∑",
      title: `${getFormatText("formula", currentLanguage)}`,
      action: () => insertFormat("$", "$"),
      shortcut: "$",
    },
  ];

  // 代码语言选项
  const codeLanguages = [
    { name: "JavaScript", value: "javascript" },
    { name: "Python", value: "python" },
    { name: "HTML", value: "html" },
    { name: "CSS", value: "css" },
    { name: "Mermaid", value: "mermaid" },
  ];

  // 自定义列表渲染组件
  const ListComponent = ({ ordered, depth = 0, children, ...props }) => {
    const Component = ordered ? "ol" : "ul";
    const baseClass = ordered ? "list-decimal" : "list-disc";

    const indentClass =
      depth === 0
        ? "ml-4 md:ml-6"
        : depth === 1
        ? "ml-6 md:ml-10"
        : "ml-8 md:ml-14";

    return (
      <Component
        className={`my-2 ${baseClass} ${indentClass} space-y-1`}
        {...props}
      >
        {children}
      </Component>
    );
  };

  const Mermaid = ({ chart }) => {
    const ref = useRef(null);

    useEffect(() => {
      mermaid.initialize({
        startOnLoad: true,
        theme: "dark",
        securityLevel: "loose",
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
        },
        sequence: {
          useMaxWidth: true,
        },
      });
    }, []);

    useEffect(() => {
      if (ref.current && chart) {
        try {
          mermaid.contentLoaded();
        } catch (error) {
          console.error("Mermaid 渲染错误:", error);
        }
      }
    }, [chart]);

    return (
      <div className="my-4 md:my-6">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-xs text-gray-400 font-mono">
            {t.mermaidChart}
          </span>
          <span className="text-xs text-gray-500">
            {t.sequenceDiagram}/{t.flowchart}
          </span>
        </div>
        <div
          ref={ref}
          className="mermaid bg-gray-800 p-3 md:p-4 rounded-lg border border-gray-700 overflow-x-auto text-sm"
        >
          {chart}
        </div>
      </div>
    );
  };

  // 自定义代码块渲染，支持 Mermaid
  const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";

    if (!inline && match && language === "mermaid") {
      return <Mermaid chart={String(children).replace(/\n$/, "")} />;
    }

    if (!inline && match) {
      return (
        <div className="relative my-4 group">
          <div className="absolute top-0 left-0 right-0 h-8 flex items-center px-4 bg-gray-800 border-b border-gray-700 rounded-t-lg">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
          <div className="absolute top-0 right-0 px-3 py-1 text-xs rounded-bl-lg bg-gray-800 text-gray-400 border-l border-b border-gray-700">
            {language}
          </div>
          <pre className="rounded-lg overflow-x-auto pt-10 border border-gray-700 bg-gray-800">
            <code className={`hljs language-${language}`} {...props}>
              {children}
            </code>
          </pre>
        </div>
      );
    }

    return (
      <div className="relative my-4 group">
        <div className="absolute top-0 left-0 right-0 h-8 flex items-center px-4 bg-gray-800 border-b border-gray-700 rounded-t-lg">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
        <pre className="rounded-lg overflow-x-auto pt-10 border border-gray-700 bg-gray-800">
          <code className="hljs" {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  };

  // 移动端工具栏组件
  const MobileToolbar = () => (
    <div
      className={`fixed z-1 bottom-8 left-0 right-0 bg-gray-800 border-t border-gray-700 p-3 duration-300 ${
        isToolbarOpen ? "display" : "hidden"
      }`}
    >
      <div className="grid grid-cols-5 gap-2">
        {toolbarItems.slice(0, 5).map((item, index) => (
          <button
            key={index}
            onClick={() => {
              item.action();
            }}
            className="p-3 rounded-lg bg-gray-700 text-gray-300 text-sm flex items-center justify-center"
            title={item.title}
          >
            {item.icon}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2 mt-2">
        {toolbarItems.slice(5, 10).map((item, index) => (
          <button
            key={index}
            onClick={() => {
              item.action();
            }}
            className="p-3 rounded-lg bg-gray-700 text-gray-300 text-sm flex items-center justify-center"
            title={item.title}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gray-900 text-gray-100 select-none"
      style={{
        cursor: dragState.current.isDragging ? "col-resize" : "default",
      }}
    >
      {/* 顶部工具栏 */}
      <header className="border-b border-gray-700 bg-gray-800 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-3 md:px-4 py-2 md:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-6">
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {isMobile ? "MD" : t.title}
              </h1>

              {!isMobile && (
                <div className="flex items-center space-x-1">
                  {toolbarItems.map((item, index) => (
                    <div key={index} className="relative group">
                      <button
                        onClick={item.action}
                        title={`${item.title} (${item.shortcut})`}
                        className="p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center space-x-1"
                      >
                        <span>{item.icon}</span>
                        {showShortcuts && (
                          <span className="text-xs text-gray-400">
                            {item.shortcut}
                          </span>
                        )}
                      </button>

                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                        {item.title} - {item.shortcut}
                      </div>
                    </div>
                  ))}

                  {/* 图表下拉菜单 */}
                  <div className="relative group">
                    <button
                      className="p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center space-x-1"
                      title={t.insertChart}
                    >
                      <span>📊</span>
                      {showShortcuts && (
                        <span className="text-xs text-gray-400">Mermaid</span>
                      )}
                    </button>
                    <div className="absolute left-0 top-full mt-1 w-48 py-2 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 bg-gray-800 border border-gray-700">
                      <div className="px-3 py-2 text-xs font-semibold border-b border-gray-700 text-gray-400">
                        {t.insertChart}
                      </div>
                      <button
                        onClick={() => insertMermaid("sequence")}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-600 hover:text-white transition-colors text-gray-300"
                      >
                        {t.sequenceDiagram}
                      </button>
                      <button
                        onClick={() => insertMermaid("flow")}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-600 hover:text-white transition-colors text-gray-300"
                      >
                        {t.flowchart}
                      </button>
                    </div>
                  </div>

                  {/* 代码块下拉菜单 */}
                  <div className="relative group">
                    <button
                      className="p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center space-x-1"
                      title={t.selectLanguage}
                    >
                      <span>💻</span>
                      {showShortcuts && (
                        <span className="text-xs text-gray-400">```</span>
                      )}
                    </button>
                    <div className="absolute left-0 top-full mt-1 w-48 py-2 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 bg-gray-800 border border-gray-700">
                      <div className="px-3 py-2 text-xs font-semibold border-b border-gray-700 text-gray-400">
                        {t.selectLanguage}
                      </div>
                      {codeLanguages.map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => insertCodeBlock(lang.value)}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-600 hover:text-white transition-colors text-gray-300"
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 语言切换下拉菜单 */}
                  <div className="relative group">
                    <button
                      className="p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center space-x-1"
                      title="切换语言"
                    >
                      <span>🌐</span>
                      <span className="text-xs">
                        {getLanguageFlag(currentLanguage)}
                      </span>
                    </button>
                    <div className="absolute left-0 top-full mt-1 w-32 py-2 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 bg-gray-800 border border-gray-700">
                      {Object.keys(languages).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setCurrentLanguage(lang)}
                          className={`block w-full text-left px-3 py-2 text-sm hover:bg-blue-600 hover:text-white transition-colors ${
                            currentLanguage === lang
                              ? "bg-blue-600 text-white"
                              : "text-gray-300"
                          }`}
                        >
                          <span className="mr-2">{getLanguageFlag(lang)}</span>
                          {getLanguageName(lang)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="text-sm px-2 md:px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-center">
                {wordCount} {t.words}
              </div>

              {!isMobile && (
                <>
                  <button
                    onClick={() => setShowLineNumbers(!showLineNumbers)}
                    className={`px-2 md:px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      showLineNumbers
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                    title={t.showLineNumbers}
                  >
                    🔢
                  </button>

                  <button
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    className={`px-2 md:px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      showShortcuts
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                    title={showShortcuts ? t.hideShortcuts : t.showShortcuts}
                  >
                    {showShortcuts ? "⌨️" : "⌨️"}
                  </button>
                </>
              )}

              {isMobile && (
                <>
                  <button
                    onClick={() =>
                      setMobileView(
                        mobileView === "editor" ? "preview" : "editor"
                      )
                    }
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 bg-gray-700 text-gray-300"
                  >
                    {mobileView === "editor" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-5 h-5 pointer-events-none"
                      >
                        <path
                          className="fill-current"
                          d="M 11.9994,8.99813C 10.3424,8.99813 8.99941,10.3411 8.99941,11.9981C 8.99941,13.6551 10.3424,14.9981 11.9994,14.9981C 13.6564,14.9981 14.9994,13.6551 14.9994,11.9981C 14.9994,10.3411 13.6564,8.99813 11.9994,8.99813 Z M 11.9994,16.9981C 9.23841,16.9981 6.99941,14.7591 6.99941,11.9981C 6.99941,9.23714 9.23841,6.99813 11.9994,6.99813C 14.7604,6.99813 16.9994,9.23714 16.9994,11.9981C 16.9994,14.7591 14.7604,16.9981 11.9994,16.9981 Z M 11.9994,4.49813C 6.99741,4.49813 2.72741,7.60915 0.99941,11.9981C 2.72741,16.3871 6.99741,19.4981 11.9994,19.4981C 17.0024,19.4981 21.2714,16.3871 22.9994,11.9981C 21.2714,7.60915 17.0024,4.49813 11.9994,4.49813 Z "
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-5 h-5 pointer-events-none"
                      >
                        <path
                          className="fill-current"
                          d="M 16.8363,2.73375C 16.45,2.73375 16.0688,2.88125 15.7712,3.17375L 13.6525,5.2925L 18.955,10.5962L 21.0737,8.47625C 21.665,7.89 21.665,6.94375 21.0737,6.3575L 17.895,3.17375C 17.6025,2.88125 17.2163,2.73375 16.8363,2.73375 Z M 12.9437,6.00125L 4.84375,14.1062L 7.4025,14.39L 7.57875,16.675L 9.85875,16.85L 10.1462,19.4088L 18.2475,11.3038M 4.2475,15.0437L 2.515,21.7337L 9.19875,19.9412L 8.955,17.7838L 6.645,17.6075L 6.465,15.2925"
                        ></path>
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setIsToolbarOpen(!isToolbarOpen)}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-700 text-gray-300"
                  >
                    {isToolbarOpen ? t.collapse : t.tools}
                  </button>
                </>
              )}

              <button
                onClick={exportMarkdown}
                className="px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white"
                title={t.export}
              >
                {t.export}
              </button>

              <button
                onClick={clearDocument}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 bg-red-600 hover:bg-red-700 text-white"
                title={t.clear}
              >
                {t.clear}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 编辑区域 */}
      <div className="flex h-[calc(100vh-80px)] relative">
        {/* 编辑器 */}
        <div
          className={`h-full overflow-hidden bg-gray-800 ${
            isMobile
              ? mobileView === "editor"
                ? "absolute inset-0"
                : "hidden"
              : "absolute left-0 top-0 bottom-0"
          }`}
          style={{
            width: isMobile ? "100%" : `${splitPosition}%`,
            transition: dragState.current.isDragging
              ? "none"
              : "width 0.1s ease",
          }}
        >
          <div className="h-full border-r border-gray-700 flex">
            {/* 行号区域 - 仅桌面端 */}
            {showLineNumbers && !isMobile && (
              <div
                ref={lineNumbersRef}
                className="w-16 bg-gray-850 border-r border-gray-700 overflow-hidden py-4 font-mono text-sm text-gray-500 select-none flex-shrink-0"
                style={{
                  height: "calc(100% - 50px)",
                  marginTop: "50px",
                }}
              />
            )}

            {/* 编辑区域 */}
            <div className="flex-1 flex flex-col">
              {!isMobile && (
                <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-700 text-gray-400 flex-shrink-0">
                  <span className="text-sm font-medium">{t.editor}</span>
                  <span className="text-xs">{t.markdownSyntax}</span>
                </div>
              )}
              <textarea
                ref={editorRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onScroll={handleEditorScroll}
                className="w-full h-full p-4 md:p-6 resize-none outline-none font-mono text-sm bg-gray-800 text-gray-100 caret-white flex-1"
                placeholder={getEditorPlaceholder(currentLanguage)}
                style={{
                  lineHeight: "1.75rem",
                  fontSize: isMobile ? "16px" : "14px",
                }}
              />
            </div>
          </div>
        </div>

        {/* 分割线 - 仅桌面端 */}
        {!isMobile && (
          <div
            className="w-2 cursor-col-resize flex items-center justify-center absolute top-0 bottom-0 z-20 bg-gray-800 hover:bg-blue-500 active:bg-blue-600 transition-colors"
            style={{
              left: `calc(${splitPosition}% - 1px)`,
              transition: dragState.current.isDragging
                ? "none"
                : "left 0.1s ease, background-color 0.2s ease",
            }}
            onMouseDown={handleSplitterMouseDown}
          >
            <div className="w-1 h-12 rounded-full bg-gray-600"></div>
          </div>
        )}

        {/* 预览区域 */}
        <div
          className={`h-full overflow-hidden bg-gray-900 ${
            isMobile
              ? mobileView === "preview"
                ? "absolute inset-0"
                : "hidden"
              : "absolute right-0 top-0 bottom-0"
          }`}
          style={{
            width: isMobile ? "100%" : `${100 - splitPosition}%`,
            transition: dragState.current.isDragging
              ? "none"
              : "width 0.1s ease",
          }}
        >
          <div className="flex-1 flex flex-col h-full">
            {!isMobile && (
              <div className="sticky top-0 px-4 md:px-6 py-3 border-b border-gray-700 bg-gray-900 text-gray-400 z-10">
                <span className="text-sm font-medium">{t.preview}</span>
              </div>
            )}
            <div ref={previewRef} className="overflow-auto">
              <div className="p-4 md:p-6">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeHighlight]}
                  components={{
                    // 响应式标题样式
                    h1: ({ children, ...props }) => (
                      <h1
                        className="text-2xl md:text-4xl font-extrabold mt-6 md:mt-10 mb-4 md:mb-6 pb-3 md:pb-4 border-b-2 md:border-b-4 border-blue-500 text-blue-400 tracking-tight"
                        {...props}
                      >
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2
                        className="text-xl md:text-3xl font-bold mt-5 md:mt-9 mb-3 md:mb-5 pb-2 md:pb-3 border-b md:border-b-2 border-purple-500 text-purple-300 tracking-tight"
                        {...props}
                      >
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3
                        className="text-lg md:text-2xl font-semibold mt-4 md:mt-8 mb-3 md:mb-4 pb-1 md:pb-2 border-b border-green-500 text-green-300 pl-2 md:pl-3"
                        {...props}
                      >
                        {children}
                      </h3>
                    ),
                    h4: ({ children, ...props }) => (
                      <h4
                        className="text-base md:text-xl font-semibold mt-4 md:mt-7 mb-2 md:mb-3 text-yellow-300 pl-3 md:pl-4 border-l-2 md:border-l-4 border-yellow-500 bg-yellow-500 bg-opacity-10 py-1"
                        {...props}
                      >
                        {children}
                      </h4>
                    ),

                    // 响应式段落样式
                    p: ({ children, ...props }) => (
                      <p
                        className="my-4 md:my-4 text-gray-200 leading-6 md:leading-6 text-base"
                        {...props}
                      >
                        {children}
                      </p>
                    ),

                    // 列表组件
                    ul: (props) => (
                      <ListComponent {...props} ordered={false} depth={0} />
                    ),
                    ol: (props) => (
                      <ListComponent {...props} ordered={true} depth={0} />
                    ),
                    li: ({ children, ...props }) => (
                      <li
                        className="py-1 md:py-2 text-gray-200 leading-6 md:leading-6"
                        {...props}
                      >
                        {children}
                      </li>
                    ),

                    // 强调文本
                    strong: ({ children, ...props }) => (
                      <strong
                        className="font-bold text-white bg-blue-500 bg-opacity-20 px-1 rounded"
                        {...props}
                      >
                        {children}
                      </strong>
                    ),
                    em: ({ children, ...props }) => (
                      <em
                        className="italic text-gray-300 bg-purple-500 bg-opacity-10 px-1 rounded"
                        {...props}
                      >
                        {children}
                      </em>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-gray-700">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-700 px-4 py-2 bg-gray-800 font-semibold text-gray-200">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-700 px-4 py-2 text-gray-300">
                        {children}
                      </td>
                    ),

                    // 代码块
                    code: CodeBlock,

                    // 引用块
                    blockquote: ({ children, ...props }) => (
                      <blockquote
                        className="border-l-2 md:border-l-4 border-blue-400 pl-3 md:pl-5 py-2 md:py-3 my-4 md:my-6 bg-gray-800 rounded-r-lg italic text-gray-300"
                        {...props}
                      >
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端工具栏 */}
      {isMobile && <MobileToolbar />}

      {/* 底部状态栏 */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-700 bg-gray-800 py-2 px-3 md:px-4 text-xs text-gray-400 z-30">
        <div className="flex justify-between items-center max-w-full mx-auto">
          <span className="hidden md:block">
            {isMobile
              ? `📱 ${t.mobileMode}`
              : `🌐 ${getLanguageName(currentLanguage)} | 💡 ${t.title}`}
          </span>
          <span className="text-xs"></span>
        </div>
      </footer>
    </div>
  );
};

const getParticipantName = (type, lang) => {
  const names = {
    user: {
      "zh-CN": "用户",
      "en-US": "User",
      "ja-JP": "ユーザー",
      "ko-KR": "사용자",
    },
    frontend: {
      "zh-CN": "前端",
      "en-US": "Frontend",
      "ja-JP": "フロントエンド",
      "ko-KR": "프론트엔드",
    },
    backend: {
      "zh-CN": "后端",
      "en-US": "Backend",
      "ja-JP": "バックエンド",
      "ko-KR": "백엔드",
    },
    system: {
      "zh-CN": "系统",
      "en-US": "System",
      "ja-JP": "システム",
      "ko-KR": "시스템",
    },
  };
  return names[type]?.[lang] || names[type]?.["en-US"] || type;
};

const getActionName = (action, lang) => {
  const actions = {
    click: {
      "zh-CN": "点击操作",
      "en-US": "Click Action",
      "ja-JP": "クリック操作",
      "ko-KR": "클릭 작업",
    },
    request: {
      "zh-CN": "请求",
      "en-US": "Request",
      "ja-JP": "リクエスト",
      "ko-KR": "요청",
    },
    response: {
      "zh-CN": "响应",
      "en-US": "Response",
      "ja-JP": "レスポンス",
      "ko-KR": "응답",
    },
    update: {
      "zh-CN": "更新界面",
      "en-US": "Update UI",
      "ja-JP": "UI更新",
      "ko-KR": "UI 업데이트",
    },
  };
  return actions[action]?.[lang] || actions[action]?.["en-US"] || action;
};

const getCodeComment = (type, lang) => {
  const comments = {
    responsive: {
      "zh-CN": "响应式设计示例",
      "en-US": "Responsive design example",
      "ja-JP": "レスポンシブデザインの例",
      "ko-KR": "반응형 디자인 예제",
    },
    placeholder: {
      "zh-CN": "在这里输入你的代码",
      "en-US": "Enter your code here",
      "ja-JP": "ここにコードを入力してください",
      "ko-KR": "여기에 코드를 입력하세요",
    },
  };
  return comments[type]?.[lang] || comments[type]?.["en-US"] || type;
};

const getFlowchartNode = (node, lang) => {
  const nodes = {
    start: {
      "zh-CN": "开始",
      "en-US": "Start",
      "ja-JP": "開始",
      "ko-KR": "시작",
    },
    process: {
      "zh-CN": "处理",
      "en-US": "Process",
      "ja-JP": "処理",
      "ko-KR": "처리",
    },
    end: { "zh-CN": "结束", "en-US": "End", "ja-JP": "終了", "ko-KR": "종료" },
  };
  return nodes[node]?.[lang] || nodes[node]?.["en-US"] || node;
};

const getHeadingText = (level, lang) => {
  const headings = {
    1: {
      "zh-CN": "一级标题",
      "en-US": "Heading 1",
      "ja-JP": "見出し1",
      "ko-KR": "제목 1",
    },
    2: {
      "zh-CN": "二级标题",
      "en-US": "Heading 2",
      "ja-JP": "見出し2",
      "ko-KR": "제목 2",
    },
    3: {
      "zh-CN": "三级标题",
      "en-US": "Heading 3",
      "ja-JP": "見出し3",
      "ko-KR": "제목 3",
    },
  };
  return (
    headings[level]?.[lang] || headings[level]?.["en-US"] || `Heading ${level}`
  );
};

const getListItemText = (lang) => {
  const texts = {
    "zh-CN": "列表项",
    "en-US": "List Item",
    "ja-JP": "リスト項目",
    "ko-KR": "목록 항목",
  };
  return texts[lang] || texts["zh-CN"];
};

const getListText = (type, lang) => {
  const texts = {
    unordered: {
      "zh-CN": "无序列表",
      "en-US": "Unordered List",
      "ja-JP": "順序なしリスト",
      "ko-KR": "순서없는 목록",
    },
    ordered: {
      "zh-CN": "有序列表",
      "en-US": "Ordered List",
      "ja-JP": "順序付きリスト",
      "ko-KR": "순서있는 목록",
    },
  };
  return texts[type]?.[lang] || texts[type]?.["en-US"] || type;
};

const getFormatText = (format, lang) => {
  const formats = {
    bold: {
      "zh-CN": "加粗",
      "en-US": "Bold",
      "ja-JP": "太字",
      "ko-KR": "굵게",
    },
    italic: {
      "zh-CN": "斜体",
      "en-US": "Italic",
      "ja-JP": "斜体",
      "ko-KR": "기울임",
    },
    code: {
      "zh-CN": "行内代码",
      "en-US": "Inline Code",
      "ja-JP": "インラインコード",
      "ko-KR": "인라인 코드",
    },
    link: {
      "zh-CN": "链接",
      "en-US": "Link",
      "ja-JP": "リンク",
      "ko-KR": "링크",
    },
    formula: {
      "zh-CN": "行内公式",
      "en-US": "Inline Formula",
      "ja-JP": "インライン数式",
      "ko-KR": "인라인 공식",
    },
  };
  return formats[format]?.[lang] || formats[format]?.["en-US"] || format;
};

const getEditorPlaceholder = (lang) => {
  const placeholders = {
    "zh-CN": "开始输入Markdown内容...支持 Mermaid 图表和数学公式",
    "en-US":
      "Start typing Markdown content...Supports Mermaid charts and mathematical formulas",
    "ja-JP": "Markdownコンテンツを入力開始...Mermaidチャートと数式をサポート",
    "ko-KR": "Markdown 내용 입력 시작...Mermaid 차트와 수학 공식 지원",
  };
  return placeholders[lang] || placeholders["zh-CN"];
};

const getLanguageFlag = (lang) => {
  const flags = {
    "zh-CN": "🇨🇳",
    "en-US": "🇺🇸",
    "ja-JP": "🇯🇵",
    "ko-KR": "🇰🇷",
  };
  return flags[lang] || "🌐";
};

const getLanguageName = (lang) => {
  const names = {
    "zh-CN": "中文",
    "en-US": "English",
    "ja-JP": "日本語",
    "ko-KR": "한국어",
  };
  return names[lang] || lang;
};

export default MarkDownEditor;
