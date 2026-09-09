const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');

const tempDir = path.join(__dirname, '../temp');

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Languages natively executable on this host
const NATIVE_LANGS = new Set(['c', 'cpp', 'c++', 'python', 'python3', 'javascript', 'node', 'js', 'java']);

// Code execution — requires authenticated user
router.post('/run', requireAuth, async (req, res) => {
  const { code, language, stdin = '', args = '' } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Code is required and cannot be empty.' });
  }
  if (!language) {
    return res.status(400).json({ error: 'Language is required.' });
  }

  const normLang = language.toLowerCase().trim();

  // For unsupported/simulated languages, return immediately with a friendly message
  if (!NATIVE_LANGS.has(normLang)) {
    return res.json({
      output: `Hello World\n`,
      error: null,
      simulated: true,
      timeMs: 1,
      exitCode: 0,
      message: `${language} runtime is not installed on this server. Output is simulated.`,
    });
  }

  const jobId = `${Date.now()}-${Math.floor(Math.random() * 99999)}`;
  const isWindows = process.platform === 'win32';
  let ext = '';
  let command = '';

  switch (normLang) {
    case 'python':
    case 'python3':
      ext = '.py'; command = 'python'; break;
    case 'javascript':
    case 'node':
    case 'js':
      ext = '.js'; command = 'node'; break;
    case 'c':
      ext = '.c'; command = 'gcc'; break;
    case 'cpp':
    case 'c++':
      ext = '.cpp'; command = 'g++'; break;
    case 'java':
      ext = '.java'; command = 'javac'; break;
    default:
      ext = '.txt'; command = 'node';
  }

  const isJava = normLang === 'java';
  const sourceFileName = isJava ? 'Main.java' : `${jobId}${ext}`;
  const filePath = path.join(tempDir, sourceFileName);
  const outPath = path.join(tempDir, isWindows ? `${jobId}.exe` : `${jobId}.out`);
  const stdinPath = path.join(tempDir, `${jobId}_stdin.txt`);

  const cleanup = () => {
    for (const p of [filePath, outPath, stdinPath]) {
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch { /* ignore */ }
    }
    // Clean up java .class files
    if (isJava) {
      try { if (fs.existsSync(path.join(tempDir, 'Main.class'))) fs.unlinkSync(path.join(tempDir, 'Main.class')); } catch { /* ignore */ }
    }
  };

  try {
    fs.writeFileSync(filePath, code, 'utf8');
    if (stdin && stdin.trim()) {
      fs.writeFileSync(stdinPath, stdin, 'utf8');
    }

    const startTime = Date.now();


    if (normLang === 'c' || normLang === 'cpp' || normLang === 'c++') {
      // Two-step: compile then run
      execFile(command, [filePath, '-o', outPath], { timeout: 10000 }, (compileErr, _, compileStderr) => {
        if (compileErr) {
          cleanup();
          return res.json({ output: '', error: compileStderr || compileErr.message, timeMs: Date.now() - startTime, exitCode: 1 });
        }
        const runArgs = args && args.trim() ? args.trim().split(/\s+/) : [];
        const stdinOpts = (stdin && stdin.trim()) ? { input: stdin } : {};
        execFile(outPath, runArgs, { timeout: 10000, maxBuffer: 1024 * 1024 * 10, ...stdinOpts }, (runErr, stdout, stderr) => {
          cleanup();
          const timeMs = Date.now() - startTime;
          if (runErr && (runErr.killed || runErr.signal === 'SIGTERM')) {
            return res.json({ output: stdout || '', error: 'Execution Timeout: Program exceeded the 10-second limit.', timeMs, exitCode: 124 });
          }
          res.json({ output: stdout || '', error: stderr || (runErr ? runErr.message : null), timeMs, exitCode: runErr ? (runErr.code || 1) : 0 });
        });
      });
      return;
    } else if (isJava) {
      execFile('javac', [filePath], { timeout: 10000 }, (compileErr, _, compileStderr) => {
        if (compileErr) {
          cleanup();
          return res.json({ output: '', error: compileStderr || compileErr.message, timeMs: Date.now() - startTime, exitCode: 1 });
        }
        const runArgs = args && args.trim() ? args.trim().split(/\s+/) : [];
        execFile('java', ['-cp', tempDir, 'Main', ...runArgs], { timeout: 10000, maxBuffer: 1024 * 1024 * 10 }, (runErr, stdout, stderr) => {
          cleanup();
          const timeMs = Date.now() - startTime;
          res.json({ output: stdout || '', error: stderr || (runErr ? runErr.message : null), timeMs, exitCode: runErr ? 1 : 0 });
        });
      });
      return;
    } else {
      const execArgs = args && args.trim() ? args.trim().split(/\s+/) : [];
      execFile(command, [filePath, ...execArgs], {
        timeout: 10000,
        maxBuffer: 1024 * 1024 * 10,
        input: (stdin && stdin.trim()) ? stdin : undefined,
        cwd: tempDir
      }, (error, stdout, stderr) => {
        const timeMs = Date.now() - startTime;
        cleanup();
        if (error && (error.killed || error.signal === 'SIGTERM')) {
          return res.json({ output: stdout || '', error: 'Execution Timeout: Program exceeded the 10-second limit.', timeMs, exitCode: 124 });
        }
        res.json({ output: stdout || '', error: stderr || (error ? error.message : null), timeMs, exitCode: error ? (error.code || 1) : 0 });
      });
    }

  } catch (err) {
    cleanup();
    console.error('[Compiler Route] Error:', err.message);
    res.status(500).json({
      error: `Server error during code execution: ${err.message}`,
    });
  }
});

module.exports = router;
