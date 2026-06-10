/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image, Clipboard, Trash2, CheckCircle2, UploadCloud, AlertCircle } from 'lucide-react';
import { compressImage } from '../lib/imageCompressor';

interface PasteFieldProps {
  screenshot: string; // base64 JPEG
  onScreenshotChange: (base64: string) => void;
}

export default function PasteField({ screenshot, onScreenshotChange }: PasteFieldProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse files for images
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Parsed file is not an image. Please copy-paste or upload a correct image file.");
      return;
    }

    try {
      setError(null);
      setIsCompressing(true);
      const base64Jpeg = await compressImage(file);
      onScreenshotChange(base64Jpeg);
    } catch (err) {
      console.error(err);
      setError("Could not process and compress this screenshot. Please try another one.");
    } finally {
      setIsCompressing(false);
    }
  };

  // Setup global page-level paste listener for absolute easiest student experience
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Don't intercept if focused on text input fields
      const targetElement = e.target as HTMLElement;
      if (
        targetElement.tagName === 'INPUT' || 
        targetElement.tagName === 'TEXTAREA' || 
        targetElement.isContentEditable
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processImageFile(file);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const clearScreenshot = () => {
    onScreenshotChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="paste-field-container" className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
          <Image className="w-4 h-4 text-indigo-500" />
          Project Screenshot
          <span className="text-[10px] font-normal text-slate-400 font-sans italic lowercase">(paste, drag, or browse)</span>
        </label>
        {screenshot && (
          <button
            type="button"
            id="clear-ss-btn"
            onClick={clearScreenshot}
            className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Image
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        id="screenshot-file-picker"
      />

      <AnimatePresence mode="wait">
        {!screenshot ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileUpload}
            id="paste-dropzone"
            className={`cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center transition-all min-h-[200px] ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99] shadow-inner'
                : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50 bg-slate-50/50 shadow-xs'
            }`}
          >
            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-xs">
              {isCompressing ? (
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            <p className="font-display font-bold text-slate-800 text-sm md:text-base">
              {isCompressing ? 'Optimizing your screenshot...' : 'Press Ctrl + V (or Command + V) here to Paste'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Or drag & drop the photo here, or <span className="text-indigo-600 font-bold underline group-hover:text-indigo-700">click to browse</span>. Works from Snipping Tool, PrintScreen or any copied image!
            </p>

            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
              <Clipboard className="w-3 h-3 animate-pulse" />
              Ctrl + V paste system active globally
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            id="screenshot-preview-wrapper"
            className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-sm"
          >
            <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-bold text-indigo-600">
                <CheckCircle2 className="w-4 h-4" />
                Screenshot Loaded & Optimized
              </div>
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[10px]">JPEG Format</span>
            </div>

            <div className="p-3 flex justify-center items-center bg-radial from-white to-slate-50 min-h-[180px] max-h-[300px] overflow-y-auto">
              <img
                src={screenshot}
                alt="Uploaded Screenshot"
                referrerPolicy="no-referrer"
                id="screenshot-preview-img"
                className="max-w-full max-h-[250px] object-contain rounded-lg shadow-md border border-slate-200"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          id="paste-error-toast"
          className="bg-red-55 border border-red-100 text-red-700 px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
  );
}
