'use client';

import { useState, useEffect, useRef } from 'react';
import { templates, languages, getTemplatesForLanguage } from '../data/templates';

export default function CodeTyping() {
  const [code, setCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [cpm, setCpm] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const textareaRef = useRef(null);

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
    }
  }, [selectedLanguage, selectedTemplate]);

  const calculateMetrics = () => {
    if (!startTime) return;
    
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    const wordsTyped = userInput.trim().split(/\s+/).length;
    const charsTyped = userInput.length;
    
    setWpm(Math.round(wordsTyped / timeElapsed));
    setCpm(Math.round(charsTyped / timeElapsed));
  };

  useEffect(() => {
    if (isTyping) {
      const interval = setInterval(calculateMetrics, 1000);
      return () => clearInterval(interval);
    }
  }, [isTyping, userInput, startTime]);

  const handleCodePaste = (e) => {
    setCode(e.target.value);
    setUserInput('');
    setStartTime(null);
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Get the current line's content
      const lines = userInput.split('\n');
      const currentLineIndex = userInput.substring(0, start).split('\n').length - 1;
      const currentLine = lines[currentLineIndex];
      
      // Calculate the current indentation
      const currentIndent = currentLine.match(/^\s*/)[0].length;
      
      // Add 2 spaces for indentation
      const newIndent = '  '; // 2 spaces
      const newText = userInput.substring(0, start) + newIndent + userInput.substring(end);
      
      setUserInput(newText);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + newIndent.length;
      }, 0);
    }
  };

  const handleTyping = (e) => {
    if (!isTyping) {
      setStartTime(Date.now());
      setIsTyping(true);
    }
    setUserInput(e.target.value);
  };

  const renderCode = () => {
    return code.split('').map((char, index) => {
      const isCorrect = userInput[index] === char;
      const isTyped = index < userInput.length;
      
      return (
        <span
          key={index}
          className={`${
            isTyped
              ? isCorrect
                ? 'text-green-500'
                : 'text-red-500'
              : 'text-gray-400'
          }`}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Template</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Programming Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full p-2 border rounded bg-white"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Type
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full p-2 border rounded bg-white"
            >
              {getTemplatesForLanguage(selectedLanguage).map((template) => (
                <option key={template} value={template}>
                  {template.charAt(0).toUpperCase() + template.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <textarea
          className="w-full p-2 border rounded"
          placeholder="Paste your code here..."
          value={code}
          onChange={handleCodePaste}
          rows={5}
        />
      </div>
      
      <div className="mb-4">
        <div className="bg-gray-100 p-4 rounded font-mono whitespace-pre-wrap">
          {renderCode()}
        </div>
      </div>
      
      <div className="mb-4">
        <textarea
          ref={textareaRef}
          className="w-full p-2 border rounded font-mono"
          placeholder="Start typing here..."
          value={userInput}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          rows={5}
          spellCheck="false"
        />
      </div>
      
      <div className="flex gap-4 text-lg">
        <div>WPM: {wpm}</div>
        <div>CPM: {cpm}</div>
      </div>
    </div>
  );
} 