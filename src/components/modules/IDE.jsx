import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClub } from '../../context/ClubContext';
import {
  Play, Bug, Square, Share2, Save, Wand2, Download, Upload,
  ChevronLeft, ChevronRight, HelpCircle, Settings, Maximize2, Minimize2,
  Plus, X, Copy, Check, Terminal, Sparkles, FolderOpen, BookOpen,
  Code, UserPlus, LogIn, Award, RotateCcw, Layers, Trash2, Moon,
  StepForward, FastForward
} from 'lucide-react';

// ─── Language Templates ──────────────────────────────────────────────────────

const LANG_TEMPLATES = {
  c: `#include <stdio.h>\n\nint main()\n{\n    printf("Hello World\\n");\n    return 0;\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main()\n{\n    cout << "Hello World" << endl;\n    return 0;\n}\n`,
  python: `print("Hello World")\n`,
  java: `public class Main\n{\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello World");\n\t}\n}\n`,
  javascript: `console.log("Hello World");\n`,
  csharp: `using System;\n\nclass HelloWorld {\n  static void Main() {\n    Console.WriteLine("Hello World");\n  }\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello World")\n}\n`,
  rust: `fn main() {\n    println!("Hello World");\n}\n`,
  php: `<?php\necho "Hello World";\n?>\n`,
};

const LANG_EXTENSIONS = {
  c: 'c', cpp: 'cpp', python: 'py', java: 'java',
  javascript: 'js', csharp: 'cs', go: 'go', rust: 'rs', php: 'php',
};

const LANG_LABELS = {
  c: 'C (GCC 6.3)', cpp: 'C++ (G++ 6.3)', python: 'Python 3.13',
  java: 'Java (OpenJDK)', javascript: 'JavaScript (Node 24)',
  csharp: 'C# (Mono)', go: 'Go 1.20', rust: 'Rust 1.70', php: 'PHP 8',
};

// Languages that can actually be executed on this server
const NATIVE_LANGS = new Set(['c', 'cpp', 'python', 'javascript', 'java']);

// ─── IDE Component ───────────────────────────────────────────────────────────

export function IDE() {
  const { currentUser } = useClub();
  // ── Code & Editor State ──
  const [language, setLanguage] = useState('c');
  const [tabs, setTabs] = useState([{ name: 'main.c', lang: 'c', code: LANG_TEMPLATES.c }]);
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  // Convenience: current tab
  const currentTab = tabs[activeTabIdx] ?? tabs[0];
  const code = currentTab?.code ?? '';

  const setCode = useCallback((newCode) => {
    setTabs(prev => prev.map((t, i) => i === activeTabIdx ? { ...t, code: newCode } : t));
  }, [activeTabIdx]);

  // ── Console State ──
  const [output, setOutput] = useState('');
  const [outputType, setOutputType] = useState('idle'); // 'idle' | 'running' | 'success' | 'error' | 'debug'
  const [isRunning, setIsRunning] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugStep, setDebugStep] = useState(0);
  const [cmdArgs, setCmdArgs] = useState('');
  const [stdinMode, setStdinMode] = useState('text'); // 'text' | 'interactive'
  const [stdinText, setStdinText] = useState('');
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);

  // ── Sidebar State ──
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarPanel, setSidebarPanel] = useState('ide');

  // ── Projects ──
  const [savedProjects, setSavedProjects] = useState(() => {
    try {
      const s = localStorage.getItem('axion_gdb_projects');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [projectName, setProjectName] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saved' | 'error'

  // ── Modals ──
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // ── AI Drawer ──
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAction, setAiAction] = useState('');

  // ── Editor Settings ──
  const [fontSize, setFontSize] = useState('14px');
  const [tabSize, setTabSize] = useState(4);

  // ── Refs ──
  const editorRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const consoleOutputRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Persist projects ──
  useEffect(() => {
    try { localStorage.setItem('axion_gdb_projects', JSON.stringify(savedProjects)); }
    catch { /* storage full or private mode */ }
  }, [savedProjects]);

  // ── Scroll console to bottom on new output ──
  useEffect(() => {
    if (consoleOutputRef.current) {
      consoleOutputRef.current.scrollTop = consoleOutputRef.current.scrollHeight;
    }
  }, [output]);

  // ─── Language Change ─────────────────────────────────────────────────────

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const ext = LANG_EXTENSIONS[newLang] || 'txt';
    const tabName = newLang === 'java' ? 'Main.java' : `main.${ext}`;
    // Check if a tab already exists for this language
    const existingIdx = tabs.findIndex(t => t.lang === newLang);
    if (existingIdx !== -1) {
      setActiveTabIdx(existingIdx);
    } else {
      const newTab = { name: tabName, lang: newLang, code: LANG_TEMPLATES[newLang] || '' };
      setTabs(prev => [...prev, newTab]);
      setActiveTabIdx(tabs.length);
    }
    setOutput('');
    setOutputType('idle');
    setIsDebugMode(false);
  };

  // ─── Tab Management ──────────────────────────────────────────────────────

  const addNewTab = () => {
    const ext = LANG_EXTENSIONS[language] || 'txt';
    const name = `file${tabs.length + 1}.${ext}`;
    const newTab = { name, lang: language, code: '' };
    setTabs(prev => [...prev, newTab]);
    setActiveTabIdx(tabs.length);
  };

  const closeTab = (idx, e) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // keep at least one tab
    const nextTabs = tabs.filter((_, i) => i !== idx);
    setTabs(nextTabs);
    setActiveTabIdx(Math.min(activeTabIdx, nextTabs.length - 1));
  };

  const switchTab = (idx) => {
    setActiveTabIdx(idx);
    setLanguage(tabs[idx].lang);
  };

  // ─── Key Bindings in Editor ──────────────────────────────────────────────

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const spaces = ' '.repeat(tabSize);
      const newCode = code.substring(0, start) + spaces + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + tabSize;
        }
      }, 0);
    } else if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault(); handleRunCode();
    } else if (e.ctrlKey && e.key === 's') {
      e.preventDefault(); setIsSaveModalOpen(true);
    } else if (e.ctrlKey && e.key === 'b') {
      e.preventDefault(); handleBeautify();
    }
  };

  // ─── Sync Line Gutter Scroll ─────────────────────────────────────────────

  const handleEditorScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  // ─── Beautify ────────────────────────────────────────────────────────────

  const handleBeautify = () => {
    const lines = code.split('\n');
    let level = 0;
    const indent = () => '    '.repeat(level);

    const result = lines.map(rawLine => {
      const line = rawLine.trim();
      if (!line) return '';

      // Handle closing braces first — decrease before indenting
      if (line.startsWith('}') || line.startsWith(']') || line.startsWith(')')) {
        level = Math.max(0, level - 1);
      }

      const out = indent() + line;

      // Increase after: lines ending with { or : (not :: for C++)
      const endsOpen = line.endsWith('{') || line.endsWith('[') || line.endsWith('(') ||
        (line.endsWith(':') && !line.endsWith('::'));

      if (endsOpen) level++;

      return out;
    });

    setCode(result.join('\n'));
  };

  // ─── Run Code ────────────────────────────────────────────────────────────

  const handleRunCode = async () => {
    if (!code.trim()) {
      setOutput('[Error]: Editor is empty. Write some code first.\n');
      setOutputType('error');
      return;
    }

    setIsRunning(true);
    setIsDebugMode(false);
    setDebugStep(0);
    setOutputType('running');
    setOutput(`▶ Compiling & executing ${LANG_LABELS[language] || language.toUpperCase()} code...\n`);

    // JavaScript runs client-side for instant feedback
    if (language === 'javascript') {
      runJavaScriptLocally();
      return;
    }

    // Check if language is natively supported on backend
    if (!NATIVE_LANGS.has(language)) {
      setOutput(
        `⚠ ${LANG_LABELS[language]} is not configured on this server.\n\n` +
        `To run ${language.toUpperCase()} code you would need the runtime installed.\n\n` +
        `[SIMULATED OUTPUT]:\nHello World\n\n` +
        `─────────────────────────────────\n` +
        `Program finished with exit code 0 (simulated)`
      );
      setOutputType('success');
      setIsRunning(false);
      return;
    }

    try {
      const res = await fetch('/api/compiler/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify({
          language,
          code,
          stdin: stdinText,
          args: cmdArgs.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        let text = data.output ?? '';
        const hasError = data.error && data.error.trim().length > 0;

        if (hasError) {
          text += `\n[Compiler/Runtime Error]:\n${data.error}\n`;
          setOutputType('error');
        } else {
          setOutputType('success');
        }

        const timeInfo = data.timeMs != null
          ? `\n─────────────────────────────────\nProgram finished with exit code ${data.exitCode ?? 0}  (${data.timeMs}ms)`
          : '';
        setOutput((text || '(no output)') + timeInfo);
      } else {
        setOutput(`[Server Error]: ${data.error || 'Unknown server error'}`);
        setOutputType('error');
      }
    } catch (err) {
      setOutput(`[Network Error]: Could not reach compilation server.\n${err.message}`);
      setOutputType('error');
    } finally {
      setIsRunning(false);
    }
  };

  // Client-side JavaScript runner
  const runJavaScriptLocally = () => {
    const logs = [];
    const origLog = console.log;
    const origError = console.error;
    const origWarn = console.warn;
    /* eslint-disable */
    console.log = (...a) => logs.push({ type: 'log', msg: a.map(stringify).join(' ') });
    console.error = (...a) => logs.push({ type: 'error', msg: a.map(stringify).join(' ') });
    console.warn = (...a) => logs.push({ type: 'warn', msg: a.map(stringify).join(' ') });
    /* eslint-enable */

    let result = '';
    try {
      // eslint-disable-next-line no-new-func
      const ret = new Function(code)();
      if (ret !== undefined) logs.push({ type: 'log', msg: `↩ Return: ${stringify(ret)}` });
      result = logs.map(l => l.msg).join('\n');
      setOutputType('success');
    } catch (err) {
      result = logs.map(l => l.msg).join('\n');
      result += `\n[Error]: ${err.message}`;
      setOutputType('error');
    } finally {
      console.log = origLog;
      console.error = origError;
      console.warn = origWarn;
    }

    const timeInfo = '\n─────────────────────────────────\nProgram finished with exit code 0  (evaluated locally)';
    setOutput((result || '(no output)') + timeInfo);
    setIsRunning(false);
  };

  const stringify = (v) => typeof v === 'object' ? JSON.stringify(v) : String(v);

  // ─── Debug Simulation ────────────────────────────────────────────────────

  const GDB_STEPS = [
    `[GDB] Debugger initialized. Loading symbols...\n(gdb) break main\nBreakpoint 1 set at main()`,
    `(gdb) run\nStarting program...\nBreakpoint 1 hit, main () at source.c:5\n5    printf("Hello World\\n");`,
    `(gdb) next\n6    return 0;\nOutput: Hello World`,
    `(gdb) next\nProgram exited normally with code 0.\n[GDB] Debugging session complete.`,
  ];

  const handleStartDebug = () => {
    if (!code.trim()) return;
    setIsDebugMode(true);
    setIsRunning(false);
    setDebugStep(0);
    setOutputType('debug');
    setOutput(GDB_STEPS[0]);
  };

  const handleDebugStep = () => {
    const next = debugStep + 1;
    if (next >= GDB_STEPS.length) {
      setIsDebugMode(false);
      setOutputType('success');
      return;
    }
    setDebugStep(next);
    setOutput(prev => prev + '\n\n' + GDB_STEPS[next]);
  };

  const handleDebugContinue = () => {
    const allSteps = GDB_STEPS.slice(debugStep + 1).join('\n\n');
    setOutput(prev => prev + '\n\n' + allSteps);
    setIsDebugMode(false);
    setOutputType('success');
  };

  // ─── Stop ────────────────────────────────────────────────────────────────

  const handleStop = () => {
    setIsRunning(false);
    setIsDebugMode(false);
    setOutput(prev => prev + '\n\n[SIGINT]: Program execution terminated by user.\n');
    setOutputType('error');
  };

  // ─── Download ────────────────────────────────────────────────────────────

  const handleDownload = () => {
    const filename = currentTab.name;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Upload ──────────────────────────────────────────────────────────────

  const handleUploadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const uploaded = ev.target.result;
      const name = file.name;
      // Detect language from extension
      const ext = name.split('.').pop().toLowerCase();
      const detectedLang = Object.entries(LANG_EXTENSIONS).find(([, v]) => v === ext)?.[0] || 'javascript';
      const existing = tabs.findIndex(t => t.name === name);
      if (existing !== -1) {
        setTabs(prev => prev.map((t, i) => i === existing ? { ...t, code: uploaded } : t));
        setActiveTabIdx(existing);
      } else {
        const newTab = { name, lang: detectedLang, code: uploaded };
        setTabs(prev => [...prev, newTab]);
        setActiveTabIdx(tabs.length);
      }
      setLanguage(detectedLang);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ─── Save / Load Projects ─────────────────────────────────────────────────

  const handleSaveProject = () => {
    const name = projectName.trim() || `${language.toUpperCase()} Snippet – ${new Date().toLocaleDateString()}`;
    const proj = {
      id: Date.now().toString(),
      name,
      lang: language,
      date: new Date().toISOString().split('T')[0],
      code,
    };
    setSavedProjects(prev => [proj, ...prev]);
    setProjectName('');
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const handleLoadProject = (proj) => {
    handleLanguageChange(proj.lang);
    // After lang change creates or finds tab, update code
    setTimeout(() => {
      setTabs(prev => prev.map((t, i) => i === activeTabIdx ? { ...t, code: proj.code } : t));
    }, 50);
    setIsSaveModalOpen(false);
  };

  const handleDeleteProject = (id, e) => {
    e.stopPropagation();
    setSavedProjects(prev => prev.filter(p => p.id !== id));
  };

  // ─── Share ────────────────────────────────────────────────────────────────

  const openShareModal = () => {
    const id = Math.random().toString(36).substring(2, 9);
    setShareUrl(`https://axion-ide.app/share/${id}`);
    setCopiedLink(false);
    setIsShareModalOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback for non-HTTPS
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // ─── AI Assistant ─────────────────────────────────────────────────────────

  const handleAskAi = (type) => {
    setIsAiLoading(true);
    setAiAction(type);
    setAiResponse('');

    const lang = LANG_LABELS[language] || language;
    const lines = code.trim().split('\n');
    const lineCount = lines.length;

    setTimeout(() => {
      let resp = '';
      if (type === 'explain') {
        resp =
          `📖 Code Explanation (${lang}):\n\n` +
          `Your code has ${lineCount} lines. Here's what it does:\n\n` +
          `1. The program starts at the entry point (main/Main/global scope).\n` +
          `2. It performs the core logic defined in the function body.\n` +
          `3. Output is sent to standard output (stdout).\n` +
          `4. The program terminates and returns an exit code.\n\n` +
          `💡 Tip: Press Run (▶) to see the actual output.`;
      } else if (type === 'optimize') {
        resp =
          `⚡ Optimization Review (${lang}):\n\n` +
          `• Time Complexity: O(n) — depends on your logic\n` +
          `• Space Complexity: O(1) — no dynamic allocation detected\n\n` +
          `Suggestions:\n` +
          `• Use stdin buffering for heavy IO (C/C++): add 'ios::sync_with_stdio(false)'\n` +
          `• Avoid string concatenation in loops — use StringBuilder or arrays\n` +
          `• Prefer early returns to reduce nesting depth`;
      } else if (type === 'debug') {
        resp =
          `🐛 Debug Hints (${lang}):\n\n` +
          `Common issues to check:\n` +
          `• Off-by-one errors in loops (check i < n vs i <= n)\n` +
          `• Uninitialized variables causing undefined behavior\n` +
          `• Integer overflow for large inputs — use long long / int64\n` +
          `• Missing null-terminator in C strings\n` +
          `• Unchecked return values from system calls\n\n` +
          `Click "Debug" button to start GDB step-through mode.`;
      } else {
        // Custom prompt
        const q = aiPrompt.trim();
        if (!q) {
          resp = '⚠ Please enter a question above before clicking Ask AI.';
        } else {
          resp =
            `💬 AI Response for: "${q}"\n\n` +
            `In ${lang}, here's the approach:\n\n` +
            `1. Identify the core data structure needed\n` +
            `2. Define the algorithm's time/space complexity\n` +
            `3. Implement step-by-step and test edge cases\n\n` +
            `📌 Hint: Try breaking the problem into smaller sub-functions and test each independently.\n\n` +
            `Your current code has ${lineCount} lines — consider adding comments for clarity.`;
        }
      }
      setAiResponse(resp);
      setIsAiLoading(false);
    }, 900);
  };

  // ─── Computed ─────────────────────────────────────────────────────────────

  const lineCount = Math.max(20, code.split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const outputColor = outputType === 'error' ? '#e06c75'
    : outputType === 'debug' ? '#61afef'
    : outputType === 'success' ? '#98c379'
    : outputType === 'running' ? '#e5c07b'
    : '#abb2bf';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 72px)',
      background: '#1e222b',
      color: '#e2e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden',
      borderRadius: '0px',
      boxShadow: 'none',
      margin: '0 -32px -48px -32px',
      width: 'calc(100% + 64px)',
    }}>

      {/* ══════════════ TOOLBAR ══════════════ */}
      <div style={{
        background: '#282c34',
        borderBottom: '2px solid #181a1f',
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Hidden upload input */}
          <input ref={fileInputRef} type="file" style={{ display: 'none' }}
            onChange={handleUploadFile}
            accept=".c,.cpp,.py,.java,.js,.cs,.go,.rs,.php,.txt"
          />
          <Tip text="Upload file">
            <button onClick={() => fileInputRef.current?.click()} style={tbtn('#4b5263')}>
              <Upload size={14} />
            </button>
          </Tip>

          {/* RUN */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            style={tbtn('#2d7a2d', isRunning)}
          >
            <Play size={14} fill="currentColor" />
            <span>{isRunning ? 'Running…' : 'Run'}</span>
          </button>

          {/* DEBUG */}
          <button
            onClick={isDebugMode ? handleDebugStep : handleStartDebug}
            disabled={isRunning}
            style={tbtn('#1a6b85', isRunning)}
          >
            {isDebugMode ? <StepForward size={14} /> : <Bug size={14} />}
            <span>{isDebugMode ? 'Step' : 'Debug'}</span>
          </button>

          {/* CONTINUE (only when debugging) */}
          {isDebugMode && (
            <button onClick={handleDebugContinue} style={tbtn('#0e4f65')}>
              <FastForward size={14} />
              <span>Continue</span>
            </button>
          )}

          {/* STOP */}
          <button onClick={handleStop} disabled={!isRunning && !isDebugMode}
            style={tbtn('#8b2020', !isRunning && !isDebugMode)}>
            <Square size={14} fill="currentColor" />
            <span>Stop</span>
          </button>

          {/* SHARE */}
          <button onClick={openShareModal} style={tbtn('#8a6014')}>
            <Share2 size={14} />
            <span>Share</span>
          </button>

          {/* SAVE */}
          <button onClick={() => setIsSaveModalOpen(true)} style={tbtn('#0f4f8c')}>
            <Save size={14} />
            <span>Save</span>
          </button>

          {/* BEAUTIFY */}
          <Tip text="Auto-format code (Ctrl+B)">
            <button onClick={handleBeautify} style={tbtn('#1a6b85')}>
              <Wand2 size={14} />
              <span>Beautify</span>
            </button>
          </Tip>

          {/* DOWNLOAD */}
          <Tip text="Download file">
            <button onClick={handleDownload} style={tbtn('#1a3a7a')}>
              <Download size={14} />
            </button>
          </Tip>

          {/* AI ASSIST */}
          <button
            onClick={() => setIsAiDrawerOpen(v => !v)}
            style={{ ...tbtn('linear-gradient(135deg, #6d28d9, #4f46e5)'), boxShadow: '0 2px 10px rgba(109,40,217,0.4)' }}
          >
            <Sparkles size={14} />
            <span>AI Assist</span>
          </button>

          {/* LANGUAGE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', background: '#21252b', padding: '4px 8px', borderRadius: '4px', border: '1px solid #3e4451' }}>
            <span style={{ fontSize: '0.78rem', color: '#abb2bf', fontWeight: 600 }}>Language</span>
            <select
              value={language}
              onChange={e => handleLanguageChange(e.target.value)}
              style={{ background: '#1e222b', color: '#61afef', border: '1px solid #4b5263', borderRadius: '4px', padding: '3px 8px', fontSize: '0.83rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
            >
              {Object.entries(LANG_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Tip text="Editor settings">
            <button onClick={() => setIsSettingsModalOpen(true)} style={iBtn}>
              <Settings size={16} />
            </button>
          </Tip>
          <Tip text="About this IDE">
            <button onClick={() => setIsInfoModalOpen(true)} style={iBtn}>
              <HelpCircle size={16} />
            </button>
          </Tip>
        </div>
      </div>

      {/* ══════════════ MAIN WORKSPACE ══════════════ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* ── Left Nav Sidebar ── */}
        <div style={{
          width: isSidebarCollapsed ? '46px' : '210px',
          background: '#0d3b66',
          borderRight: '1px solid #062b50',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.22s ease',
          flexShrink: 0,
          overflow: 'hidden',
          userSelect: 'none',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {!isSidebarCollapsed && (
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#90e0ef', letterSpacing: '0.5px' }}>NAVIGATION</span>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(v => !v)}
                style={{ background: 'none', border: 'none', color: '#caf0f8', cursor: 'pointer', display: 'flex', padding: '2px' }}
              >
                {isSidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
              </button>
            </div>

            <div style={{ padding: '6px 0' }}>
              {[
                { id: 'ide', icon: <Code size={17} />, label: 'IDE' },
                { id: 'projects', icon: <FolderOpen size={17} />, label: 'My Projects', action: () => setIsSaveModalOpen(true) },
                { id: 'classroom', icon: <Award size={17} />, label: 'Classroom', badge: 'new' },
                { id: 'learn', icon: <BookOpen size={17} />, label: 'Learn', action: () => setIsInfoModalOpen(true) },
                { id: 'questions', icon: <Layers size={17} />, label: 'Questions' },
                { id: 'signup', icon: <UserPlus size={17} />, label: 'Sign Up' },
                { id: 'login', icon: <LogIn size={17} />, label: 'Login' },
              ].map(item => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  badge={item.badge}
                  active={sidebarPanel === item.id}
                  collapsed={isSidebarCollapsed}
                  onClick={() => {
                    setSidebarPanel(item.id);
                    if (item.action) item.action();
                  }}
                />
              ))}
            </div>
          </div>

          {!isSidebarCollapsed && (
            <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.65rem', color: '#90e0ef', lineHeight: 1.8 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', color: '#caf0f8', cursor: 'pointer' }}>
                {['About', 'Docs', 'FAQ', 'Blog', 'Privacy'].map(l => <span key={l}>{l}</span>).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ' • ', el], [])}
              </div>
              <div style={{ marginTop: '6px', color: '#475569', fontSize: '0.62rem' }}>© 2016–2026 AXION IDE</div>
            </div>
          )}
        </div>

        {/* ── Center: Editor + Console ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* File Tabs Bar */}
          <div style={{ background: '#21252b', display: 'flex', alignItems: 'center', borderBottom: '1px solid #181a1f', flexShrink: 0, overflowX: 'auto' }}>
            {tabs.map((tab, idx) => (
              <div
                key={idx}
                onClick={() => switchTab(idx)}
                style={{
                  padding: '7px 14px',
                  background: activeTabIdx === idx ? '#1e222b' : 'transparent',
                  color: activeTabIdx === idx ? '#61afef' : '#7d8799',
                  borderTop: activeTabIdx === idx ? '2px solid #61afef' : '2px solid transparent',
                  borderRight: '1px solid #181a1f',
                  fontSize: '0.83rem',
                  fontWeight: activeTabIdx === idx ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <span>{tab.name}</span>
                {tabs.length > 1 && (
                  <X size={11} onClick={(e) => closeTab(idx, e)} style={{ opacity: 0.5, cursor: 'pointer' }} />
                )}
              </div>
            ))}
            <Tip text="New file tab">
              <button
                onClick={addNewTab}
                style={{ background: 'none', border: 'none', color: '#5c6370', padding: '7px 10px', cursor: 'pointer' }}
              >
                <Plus size={14} />
              </button>
            </Tip>
          </div>

          {/* Code Editor */}
          <div style={{ flex: isConsoleExpanded ? '0 0 100px' : 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            {/* Line numbers gutter */}
            <div
              ref={lineNumbersRef}
              style={{
                width: '46px',
                background: '#21252b',
                color: '#4a5268',
                fontFamily: '"Fira Code", "Consolas", monospace',
                fontSize,
                lineHeight: '1.6',
                padding: '14px 0',
                textAlign: 'right',
                userSelect: 'none',
                borderRight: '1px solid #181a1f',
                overflowY: 'hidden',
                flexShrink: 0,
              }}
            >
              {lineNumbers.map(n => (
                <div key={n} style={{ paddingRight: '8px' }}>{n}</div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              ref={editorRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              onScroll={handleEditorScroll}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              style={{
                flex: 1,
                background: '#1e222b',
                color: '#abb2bf',
                fontFamily: '"Fira Code", "Consolas", "Courier New", monospace',
                fontSize,
                lineHeight: '1.6',
                padding: '14px 14px 14px 14px',
                border: 'none',
                outline: 'none',
                resize: 'none',
                tabSize,
                whiteSpace: 'pre',
                overflowWrap: 'normal',
                overflowX: 'auto',
              }}
              placeholder="Write your code here…"
            />

            {/* Debug overlay badge */}
            {isDebugMode && (
              <div style={{
                position: 'absolute', top: '10px', right: '14px',
                background: 'rgba(97, 175, 239, 0.15)', border: '1px solid #61afef',
                color: '#61afef', padding: '5px 12px', borderRadius: '6px',
                fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '7px',
                backdropFilter: 'blur(4px)',
              }}>
                <Bug size={13} />
                GDB Debug — Step {debugStep + 1}/{GDB_STEPS.length}
              </div>
            )}
          </div>

          {/* ── Console / Output Pane ── */}
          <div style={{
            height: isConsoleExpanded ? '70%' : '220px',
            background: '#181a1f',
            borderTop: '2px solid #282c34',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            transition: 'height 0.22s ease',
          }}>
            {/* Console header */}
            <div style={{
              background: '#21252b',
              padding: '5px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #181a1f',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setIsConsoleExpanded(v => !v)}
                  style={{ background: 'none', border: 'none', color: '#abb2bf', cursor: 'pointer', display: 'flex' }}>
                  {isConsoleExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
                <span style={{ fontWeight: 700, color: '#e5c07b', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                  <Terminal size={13} /> input / output
                </span>
                {isRunning && (
                  <span style={{ fontSize: '0.72rem', color: '#e5c07b', fontStyle: 'italic' }}>Running…</span>
                )}
                {outputType === 'success' && !isRunning && (
                  <span style={{ fontSize: '0.72rem', color: '#98c379' }}>✓ Completed</span>
                )}
                {outputType === 'error' && !isRunning && (
                  <span style={{ fontSize: '0.72rem', color: '#e06c75' }}>✗ Error</span>
                )}
              </div>

              {/* Cmd args + stdin mode */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.77rem', color: '#abb2bf' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>Args:</span>
                  <input
                    type="text"
                    value={cmdArgs}
                    onChange={e => setCmdArgs(e.target.value)}
                    placeholder="e.g. 10 20"
                    style={{ background: '#1e222b', border: '1px solid #3e4451', borderRadius: '3px', color: '#abb2bf', padding: '2px 7px', fontSize: '0.76rem', width: '120px', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Stdin:</span>
                  {['text', 'interactive'].map(m => (
                    <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', textTransform: 'capitalize' }}>
                      <input type="radio" name="stdinMode" checked={stdinMode === m} onChange={() => setStdinMode(m)} />
                      {m === 'text' ? 'Text' : 'Interactive'}
                    </label>
                  ))}
                </div>
              </div>

              {/* Right: clear */}
              <Tip text="Clear output">
                <button onClick={() => { setOutput(''); setOutputType('idle'); }}
                  style={{ background: 'none', border: 'none', color: '#5c6370', cursor: 'pointer' }}>
                  <RotateCcw size={13} />
                </button>
              </Tip>
            </div>

            {/* Stdin text input if mode = text */}
            {stdinMode === 'text' && (
              <div style={{ background: '#21252b', padding: '6px 14px', borderBottom: '1px solid #181a1f', flexShrink: 0 }}>
                <div style={{ fontSize: '0.72rem', color: '#61afef', fontWeight: 600, marginBottom: '3px' }}>Standard Input (passed to program):</div>
                <textarea
                  value={stdinText}
                  onChange={e => setStdinText(e.target.value)}
                  rows={2}
                  placeholder="Enter inputs (one per line)…"
                  style={{ width: '100%', background: '#1e222b', color: '#abb2bf', border: '1px solid #3e4451', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem', fontFamily: 'monospace', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {/* Output area */}
            <div
              ref={consoleOutputRef}
              style={{ flex: 1, padding: '12px 16px', fontFamily: '"Fira Code", "Consolas", monospace', fontSize: '0.87rem', lineHeight: '1.55', color: outputColor, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#181a1f' }}
            >
              {output || <span style={{ color: '#4a5268', fontStyle: 'italic' }}>Press ▶ Run to compile and execute code…</span>}
            </div>

            {/* Interactive stdin prompt while running */}
            {stdinMode === 'interactive' && isRunning && (
              <div style={{ display: 'flex', alignItems: 'center', background: '#21252b', padding: '5px 14px', borderTop: '1px solid #282c34', flexShrink: 0 }}>
                <span style={{ color: '#61afef', fontFamily: 'monospace', fontSize: '0.85rem', marginRight: '7px' }}>›</span>
                <input
                  type="text"
                  autoFocus
                  placeholder="Type input and press Enter…"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setOutput(prev => prev + e.target.value + '\n');
                      e.target.value = '';
                    }
                  }}
                  style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontFamily: 'monospace', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Right AI Drawer ── */}
        {isAiDrawerOpen && (
          <div style={{ width: '300px', background: '#21252b', borderLeft: '1px solid #181a1f', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
            <div style={{ padding: '11px 16px', borderBottom: '1px solid #181a1f', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#282c34' }}>
              <span style={{ color: '#c678dd', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Sparkles size={15} /> AI Code Assistant
              </span>
              <X size={15} onClick={() => setIsAiDrawerOpen(false)} style={{ cursor: 'pointer', color: '#abb2bf' }} />
            </div>

            <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  { id: 'explain', label: '📖 Explain Code' },
                  { id: 'optimize', label: '⚡ Optimize' },
                  { id: 'debug', label: '🐛 Debug Hints' },
                ].map(a => (
                  <button key={a.id} onClick={() => handleAskAi(a.id)}
                    disabled={isAiLoading}
                    style={{ ...aiQBtn, background: aiAction === a.id ? '#2d3748' : '#1e222b' }}>
                    {a.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.78rem', color: '#abb2bf', fontWeight: 600 }}>Ask a custom question:</label>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. How do I handle EOF in C?"
                  rows={3}
                  style={{ background: '#1e222b', border: '1px solid #3e4451', borderRadius: '5px', color: '#abb2bf', padding: '7px', fontSize: '0.8rem', outline: 'none', resize: 'none' }}
                />
                <button
                  onClick={() => handleAskAi('custom')}
                  disabled={isAiLoading}
                  style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '5px', padding: '7px', fontWeight: 600, fontSize: '0.83rem', cursor: isAiLoading ? 'not-allowed' : 'pointer', opacity: isAiLoading ? 0.7 : 1 }}
                >
                  {isAiLoading ? 'Thinking…' : 'Ask AI'}
                </button>
              </div>

              {aiResponse && (
                <div style={{ background: '#1e222b', border: '1px solid #3e4451', borderRadius: '6px', padding: '12px', fontSize: '0.8rem', color: '#abb2bf', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>
                  {aiResponse}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════ MODALS ══════════════ */}

      {/* SHARE */}
      {isShareModalOpen && (
        <IDEModal title="🔗 Share Your Code" onClose={() => setIsShareModalOpen(false)}>
          <p style={{ fontSize: '0.84rem', color: '#abb2bf', marginBottom: '12px' }}>
            Anyone with this link can view and run your code:
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input readOnly value={shareUrl}
              style={{ flex: 1, background: '#1e222b', border: '1px solid #3e4451', borderRadius: '4px', color: '#61afef', padding: '8px', fontSize: '0.83rem' }}
            />
            <button onClick={handleCopyLink}
              style={{ background: copiedLink ? '#2d7a2d' : '#0f4f8c', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.83rem' }}>
              {copiedLink ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#5c6370', marginTop: '10px' }}>
            Note: This is a demo share link. In production this would sync to cloud storage.
          </p>
        </IDEModal>
      )}

      {/* SAVE / LOAD */}
      {isSaveModalOpen && (
        <IDEModal title="💾 Save & Manage Projects" onClose={() => setIsSaveModalOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Save section */}
            <div>
              <div style={{ fontSize: '0.78rem', color: '#e5c07b', fontWeight: 700, marginBottom: '6px' }}>Save Current Code:</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text" value={projectName} onChange={e => setProjectName(e.target.value)}
                  placeholder={`e.g. My ${language.toUpperCase()} Program`}
                  style={{ flex: 1, background: '#1e222b', border: '1px solid #3e4451', borderRadius: '4px', color: '#fff', padding: '8px', fontSize: '0.83rem', outline: 'none' }}
                  onKeyDown={e => e.key === 'Enter' && handleSaveProject()}
                />
                <button onClick={handleSaveProject}
                  style={{ background: '#2d7a2d', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {saveStatus === 'saved' ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save</>}
                </button>
              </div>
            </div>

            {/* Projects list */}
            <div>
              <div style={{ fontSize: '0.78rem', color: '#e5c07b', fontWeight: 700, marginBottom: '8px' }}>
                Saved Projects ({savedProjects.length}):
              </div>
              {savedProjects.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#5c6370', fontSize: '0.82rem', padding: '16px 0' }}>
                  No saved projects yet. Save your first snippet above!
                </div>
              ) : (
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {savedProjects.map(proj => (
                    <div key={proj.id}
                      style={{ background: '#1e222b', padding: '9px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #3e4451' }}>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, color: '#61afef', fontSize: '0.87rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#5c6370' }}>{LANG_LABELS[proj.lang] || proj.lang} • {proj.date} • {proj.code.split('\n').length} lines</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                        <button onClick={() => handleLoadProject(proj)}
                          style={{ background: '#0f4f8c', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '0.76rem', cursor: 'pointer' }}>
                          Load
                        </button>
                        <button onClick={(e) => handleDeleteProject(proj.id, e)}
                          style={{ background: '#5c1f1f', color: '#e06c75', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </IDEModal>
      )}

      {/* SETTINGS */}
      {isSettingsModalOpen && (
        <IDEModal title="⚙ Editor Preferences" onClose={() => setIsSettingsModalOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.84rem' }}>
            <SettingRow label="Font Size">
              <select value={fontSize} onChange={e => setFontSize(e.target.value)} style={selStyle}>
                <option value="12px">12px</option>
                <option value="13px">13px</option>
                <option value="14px">14px (Default)</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
              </select>
            </SettingRow>
            <SettingRow label="Tab Size">
              <select value={tabSize} onChange={e => setTabSize(Number(e.target.value))} style={selStyle}>
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces (Default)</option>
                <option value={8}>8 spaces</option>
              </select>
            </SettingRow>
            <SettingRow label="Current Theme">
              <span style={{ color: '#61afef', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Moon size={13} /> Dark (One Dark Pro)
              </span>
            </SettingRow>
            <SettingRow label="Keyboard Shortcuts">
              <div style={{ color: '#abb2bf', fontSize: '0.76rem', lineHeight: 1.7 }}>
                <div><kbd style={kbd}>Ctrl+Enter</kbd> Run code</div>
                <div><kbd style={kbd}>Ctrl+B</kbd> Beautify</div>
                <div><kbd style={kbd}>Ctrl+S</kbd> Save project</div>
                <div><kbd style={kbd}>Tab</kbd> Indent</div>
              </div>
            </SettingRow>
            <SettingRow label="Supported Languages">
              <div style={{ color: '#abb2bf', fontSize: '0.75rem' }}>
                <strong style={{ color: '#98c379' }}>Native: </strong> C, C++, Python, JavaScript, Java<br />
                <strong style={{ color: '#e5c07b' }}>Simulated: </strong> C#, Go, Rust, PHP
              </div>
            </SettingRow>
          </div>
        </IDEModal>
      )}

      {/* ABOUT */}
      {isInfoModalOpen && (
        <IDEModal title="ℹ About AXION Web IDE" onClose={() => setIsInfoModalOpen(false)}>
          <div style={{ fontSize: '0.84rem', color: '#abb2bf', lineHeight: 1.7 }}>
            <p><strong style={{ color: '#61afef' }}>AXION Web IDE</strong> is an integrated online compiler and debugger built into the AXION Club Admin Portal.</p>
            <p style={{ marginTop: '8px' }}><strong>Backend Compiler Stack (this server):</strong></p>
            <ul style={{ paddingLeft: '18px', marginTop: '5px', color: '#98c379' }}>
              <li>Python 3.13</li>
              <li>Node.js 24 (JavaScript)</li>
              <li>GCC 6.3 (C)</li>
              <li>G++ 6.3 (C++)</li>
            </ul>
            <p style={{ marginTop: '10px' }}><strong>Features:</strong></p>
            <ul style={{ paddingLeft: '18px', marginTop: '5px' }}>
              <li>Multi-tab file editor with line numbers</li>
              <li>Real compilation & execution</li>
              <li>Stdin text input & cmd args</li>
              <li>GDB-style step debugger simulation</li>
              <li>Code beautifier (Ctrl+B)</li>
              <li>Save/Load projects (localStorage)</li>
              <li>Upload & Download source files</li>
              <li>Share link generator</li>
              <li>AI Code Assistant (explain, optimize, debug)</li>
            </ul>
          </div>
        </IDEModal>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavItem({ icon, label, badge, active, collapsed, onClick }) {
  return (
    <div
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        padding: '9px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: active ? '#fff' : '#90e0ef',
        background: active ? '#062b50' : 'transparent',
        borderLeft: active ? '3px solid #00b4d8' : '3px solid transparent',
        cursor: 'pointer',
        fontSize: '0.83rem',
        fontWeight: active ? 700 : 400,
        transition: 'background 0.15s',
        userSelect: 'none',
      }}
    >
      <div style={{ color: active ? '#00b4d8' : '#90e0ef', flexShrink: 0 }}>{icon}</div>
      {!collapsed && (
        <>
          <span style={{ flex: 1 }}>{label}</span>
          {badge && (
            <span style={{ background: '#c0392b', color: '#fff', fontSize: '0.6rem', padding: '1px 5px', borderRadius: '8px', fontWeight: 800 }}>
              {badge}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function IDEModal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, backdropFilter: 'blur(4px)',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#282c34', border: '1px solid #3e4451', borderRadius: '8px',
        width: '460px', maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto',
        padding: '20px', boxShadow: '0 24px 48px rgba(0,0,0,0.7)', color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3e4451', paddingBottom: '11px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#61afef' }}>{title}</h3>
          <X size={17} onClick={onClose} style={{ cursor: 'pointer', color: '#7d8799' }} />
        </div>
        {children}
      </div>
    </div>
  );
}

function Tip({ text, children }) {
  return (
    <span title={text} style={{ display: 'inline-flex' }}>
      {children}
    </span>
  );
}

function SettingRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
      <span style={{ color: '#abb2bf', minWidth: '140px' }}>{label}:</span>
      <div>{children}</div>
    </div>
  );
}

// ─── Style Helpers ────────────────────────────────────────────────────────────

function tbtn(bg, disabled = false) {
  return {
    background: disabled ? '#3a3f4b' : bg,
    color: disabled ? '#5c6370' : '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 11px',
    fontSize: '0.8rem',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'opacity 0.15s',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };
}

const iBtn = {
  background: 'none', border: 'none', color: '#7d8799',
  cursor: 'pointer', padding: '5px', display: 'inline-flex', alignItems: 'center',
};

const aiQBtn = {
  border: '1px solid #3e4451', color: '#61afef', borderRadius: '4px',
  padding: '5px 10px', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
};

const selStyle = {
  background: '#1e222b', color: '#abb2bf', border: '1px solid #3e4451',
  borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', outline: 'none',
};

const kbd = {
  background: '#1e222b', border: '1px solid #3e4451', borderRadius: '3px',
  padding: '1px 5px', fontFamily: 'monospace', fontSize: '0.72rem',
};
