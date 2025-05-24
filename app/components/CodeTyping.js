'use client';

import { useState, useEffect, useRef } from 'react';
import { templates, languages, getTemplatesForLanguage } from '../data/templates';

export default function CodeTyping() {
  const [code, setCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [cpm, setCpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [mimicIDE, setMimicIDE] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState(null);
  const textareaRef = useRef(null);
  const codeDisplayRef = useRef(null);

  useEffect(() => {
    const availableTemplates = getTemplatesForLanguage(selectedLanguage);
    if (availableTemplates.length > 0) {
      setSelectedTemplate(availableTemplates[0]);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (selectedLanguage && selectedTemplate) {
      setCode(templates[selectedLanguage][selectedTemplate]);
      setUserInput('');
      setStartTime(null);
      setIsTyping(false);
      setIsCompleted(false);
      setIsPaused(false);
      setPausedTime(0);
      setElapsedTime(0);
      setPauseStartTime(null);
    }
  }, [selectedLanguage, selectedTemplate]);

  const calculateMetrics = () => {
    if (!startTime) return;
    
    const currentTime = Date.now();
    const totalElapsed = (currentTime - startTime) / 1000;
    const activeTime = totalElapsed - (pausedTime / 1000);
    const timeElapsedMinutes = activeTime / 60; // in minutes
    
    setElapsedTime(totalElapsed);
    
    const wordsTyped = userInput.trim().split(/\s+/).length;
    const charsTyped = userInput.length;
    
    // Calculate accuracy
    let correctChars = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === code[i]) {
        correctChars++;
      }
    }
    const accuracyPercent = userInput.length > 0 ? Math.round((correctChars / userInput.length) * 100) : 100;
    
    if (timeElapsedMinutes > 0) {
      setWpm(Math.round(wordsTyped / timeElapsedMinutes));
      setCpm(Math.round(charsTyped / timeElapsedMinutes));
    }
    setAccuracy(accuracyPercent);
    
    // Check if completed
    if (userInput === code) {
      setIsCompleted(true);
      setIsTyping(false);
      setIsPaused(false);
    }
  };

  useEffect(() => {
    if (isTyping && !isPaused) {
      const interval = setInterval(calculateMetrics, 1000);
      return () => clearInterval(interval);
    }
  }, [isTyping, isPaused, userInput, startTime, pausedTime]);

  const handleCodePaste = (e) => {
    setCode(e.target.value);
    setUserInput('');
    setStartTime(null);
    setIsTyping(false);
    setIsCompleted(false);
    setIsPaused(false);
    setPausedTime(0);
    setElapsedTime(0);
    setPauseStartTime(null);
  };

  const togglePause = () => {
    if (!isTyping) return;
    
    if (isPaused) {
      // Resume: add paused duration to total paused time
      if (pauseStartTime) {
        setPausedTime(prev => prev + (Date.now() - pauseStartTime));
        setPauseStartTime(null);
      }
      setIsPaused(false);
    } else {
      // Pause: record when pause started
      setPauseStartTime(Date.now());
      setIsPaused(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyDown = (e) => {
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (e.key === 'Tab') {
      e.preventDefault();
      
      const newIndent = '  '; // 2 spaces
      const newText = userInput.substring(0, start) + newIndent + userInput.substring(end);
      
      setUserInput(newText);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + newIndent.length;
      }, 0);
      return;
    }

    if (!mimicIDE) return;

    // Auto-completion for brackets, quotes, etc.
    const pairs = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`'
    };

    if (pairs[e.key]) {
      e.preventDefault();
      const closingChar = pairs[e.key];
      const newText = userInput.substring(0, start) + e.key + closingChar + userInput.substring(end);
      setUserInput(newText);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
      return;
    }

    // Skip over closing characters if they match what's next
    if ([')', ']', '}', '"', "'", '`'].includes(e.key)) {
      if (userInput[start] === e.key) {
        e.preventDefault();
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
        return;
      }
    }

    // Auto-indentation on Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const lines = userInput.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];
      
      // Get current indentation
      const indentMatch = currentLine.match(/^(\s*)/);
      const currentIndent = indentMatch ? indentMatch[1] : '';
      
      // Check if cursor is between auto-completed brackets
      const charBefore = userInput[start - 1];
      const charAfter = userInput[start];
      const isBetweenBrackets = (charBefore === '{' && charAfter === '}') ||
                               (charBefore === '(' && charAfter === ')') ||
                               (charBefore === '[' && charAfter === ']');
      
      if (isBetweenBrackets) {
        // Cursor is between auto-completed brackets - add newline with indent, move closing bracket down
        const extraIndent = '  ';
        const newText = userInput.substring(0, start) + '\n' + currentIndent + extraIndent + 
                       '\n' + currentIndent + userInput.substring(start);
        const cursorPos = start + 1 + currentIndent.length + extraIndent.length;
        
        setUserInput(newText);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = cursorPos;
        }, 0);
        return;
      }
      
      // Check if we need extra indentation (after opening brackets)
      const needsExtraIndent = /[{(\[][\s]*$/.test(currentLine.trim());
      const extraIndent = needsExtraIndent ? '  ' : '';
      
      // Just add newline with appropriate indentation
      const newText = userInput.substring(0, start) + '\n' + currentIndent + extraIndent + userInput.substring(end);
      const cursorPos = start + 1 + currentIndent.length + extraIndent.length;
      
      setUserInput(newText);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = cursorPos;
      }, 0);
      return;
    }

    // Handle backspace with smart bracket deletion
    if (e.key === 'Backspace' && start === end && start > 0) {
      const prevChar = userInput[start - 1];
      const nextChar = userInput[start];
      
      // Delete matching pair if cursor is between them
      if (pairs[prevChar] && pairs[prevChar] === nextChar) {
        e.preventDefault();
        const newText = userInput.substring(0, start - 1) + userInput.substring(start + 1);
        setUserInput(newText);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start - 1;
        }, 0);
        return;
      }
    }
  };

  const handleTyping = (e) => {
    if (isPaused) return; // Prevent typing when paused
    
    if (!isTyping && !isCompleted) {
      setStartTime(Date.now());
      setIsTyping(true);
    }
    setUserInput(e.target.value);
    
    // Sync scroll position
    if (textareaRef.current && codeDisplayRef.current) {
      codeDisplayRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleScroll = (e) => {
    // Sync scroll between textarea and code display
    if (codeDisplayRef.current) {
      codeDisplayRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const renderCode = () => {
    return code.split('').map((char, index) => {
      const isCorrect = userInput[index] === char;
      const isTyped = index < userInput.length;
      const isCursor = index === userInput.length && !isCompleted;
      
      return (
        <span
          key={index}
          className={`relative ${
            isTyped
              ? isCorrect
                ? 'text-green-400 bg-green-50'
                : 'text-red-400 bg-red-50'
              : 'text-slate-500'
          } ${isCursor ? 'bg-blue-200 animate-pulse' : ''}`}
        >
          {char === '\n' ? '\n' : char}
        </span>
      );
    });
  };

  const resetChallenge = () => {
    setUserInput('');
    setStartTime(null);
    setIsTyping(false);
    setIsCompleted(false);
    setWpm(0);
    setCpm(0);
    setAccuracy(100);
    setIsPaused(false);
    setPausedTime(0);
    setElapsedTime(0);
    setPauseStartTime(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Code Typing Challenge</h1>
          <p className="text-slate-600">Improve your coding speed and accuracy</p>
        </div>

        {/* Template Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Select Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Programming Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Template Type
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {getTemplatesForLanguage(selectedLanguage).map((template) => (
                  <option key={template} value={template}>
                    {template.charAt(0).toUpperCase() + template.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* IDE Features Toggle */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={mimicIDE}
                onChange={(e) => setMimicIDE(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">Mimic IDE</span>
                <p className="text-xs text-slate-500">
                  Enable auto-indentation, bracket completion, and other IDE-like features
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Custom Code Input */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Custom Code (Optional)</h3>
          <textarea
            className="w-full p-4 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Paste your custom code here to override the template..."
            value={code}
            onChange={handleCodePaste}
            rows={6}
          />
        </div>

        {/* Stats Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{wpm}</div>
              <div className="text-sm text-slate-600">WPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{cpm}</div>
              <div className="text-sm text-slate-600">CPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{accuracy}%</div>
              <div className="text-sm text-slate-600">Accuracy</div>
            </div>
            <div className="text-center">
              <button
                onClick={resetChallenge}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Main Typing Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Display */}
          <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
              <h3 className="text-white font-medium">Reference Code</h3>
            </div>
            <div
              ref={codeDisplayRef}
              className="p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-auto h-96 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
              style={{ scrollbarWidth: 'thin' }}
            >
              {renderCode()}
            </div>
          </div>

          {/* Typing Area */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-slate-800 font-medium">Your Code</h3>
              <div className="flex items-center space-x-4">
                {/* Timer Display */}
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-mono">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
                
                {/* Pause/Play Button */}
                <button
                  onClick={togglePause}
                  disabled={!isTyping || isCompleted}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  title={isPaused ? "Resume typing" : "Pause typing"}
                >
                  {isPaused ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="p-4">
              <textarea
                ref={textareaRef}
                className={`w-full h-96 p-4 border border-slate-300 rounded-lg font-mono text-sm leading-relaxed resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isPaused ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                placeholder="Start typing the code above..."
                value={userInput}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                spellCheck="false"
                disabled={isCompleted || isPaused}
              />
            </div>
          </div>
        </div>

        {/* Completion Message */}
        {isCompleted && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-green-600 text-2xl mb-2">🎉 Congratulations!</div>
            <div className="text-green-800 font-semibold mb-2">Challenge Completed!</div>
            <div className="text-green-700">
              Final Stats: {wpm} WPM • {cpm} CPM • {accuracy}% Accuracy
            </div>
          </div>
        )}
      </div>
    </div>
  );
}