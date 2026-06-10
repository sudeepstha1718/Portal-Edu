/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Download, Printer, User, BookOpen, Presentation, Hash, Trash2, FileDown } from 'lucide-react';
import { Submission } from '../types';

interface SubmissionCardProps {
  key?: string | number;
  submission: Submission;
  onPrint: (submission: Submission) => void;
  onDelete: (id: string) => void;
  onView: (submission: Submission) => void;
}

export default function SubmissionCard({ submission, onPrint, onDelete, onView }: SubmissionCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  // Safe base64-to-blob-URL helper to bypass modern sandbox iframe restrictions on direct data resource navigation
  const downloadDataUrl = (dataurl: string, filename: string) => {
    try {
      const arr = dataurl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Blob conversion failed style, falling back to primitive data URL:", err);
      const link = document.createElement('a');
      link.href = dataurl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Utility to handle downloading the base64 screenshot renamed dynamically
  const handleDownload = () => {
    // Sanitize values to prevent illegal file character pathing on Windows/Mac
    const sanitizeName = (val: string) => val.replace(/[\/\\:*?"<>|]/g, '-').trim();
    
    // Construct exactly as requested: name / project / class / roll
    const fName = sanitizeName(submission.name);
    const fProject = sanitizeName(submission.projectName);
    const fClass = sanitizeName(submission.class);
    const fRoll = sanitizeName(submission.rollNo);
    
    const filename = `${fName}_${fProject}_${fClass}_${fRoll}.jpg`;
    downloadDataUrl(submission.screenshot, filename);
  };

  // Utility to handle downloading student uploaded custom files, automatically renamed!
  const handleDownloadFile = () => {
    if (!submission.projectFileContent || !submission.projectFileName) return;

    // Sanitize values to prevent illegal file character pathing on Windows/Mac
    const sanitizeName = (val: string) => val.replace(/[\/\\:*?"<>|]/g, '-').trim();
    
    const fName = sanitizeName(submission.name);
    const fProject = sanitizeName(submission.projectName);
    const fClass = sanitizeName(submission.class);
    const fRoll = sanitizeName(submission.rollNo);
    const origFilename = sanitizeName(submission.projectFileName);
    
    // Auto-renamed combination of student, class details and original file name
    const filename = `${fName}_${fProject}_${fClass}_${fRoll}_${origFilename}`;
    downloadDataUrl(submission.projectFileContent, filename);
  };

  const timeString = new Date(submission.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      id={`submission-card-${submission.id}`}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col group font-sans"
    >
      {/* Thumbnail Area with overlay actions */}
      <div 
        onClick={() => onView(submission)}
        className="relative h-44 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100 group cursor-pointer"
        title="Click to view file and photo in-app"
      >
        <img
          src={submission.screenshot}
          alt={`${submission.name} Project screenshot`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          id={`thumbnail-img-${submission.id}`}
        />
        
        {/* Quick action actions on hover over thumbnail */}
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
          <div className="px-4 py-2 bg-white text-indigo-700 rounded-full font-bold text-xs shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1.5">
            Details & Grade
          </div>
        </div>

        {/* Floating details badge */}
        <div className="absolute top-3 left-3 px-2 py-0.5 bg-slate-900/75 backdrop-blur-3xl text-[10px] font-mono text-white rounded-md tracking-wider flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          {timeString}
        </div>

        {/* Floating Grade badge if assigned */}
        {submission.grade && (
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-indigo-600 font-extrabold text-[10px] text-white rounded-md tracking-wider shadow-sm">
            GRADE: {submission.grade}
          </div>
        )}
      </div>

      {/* Text Details Area */}
      <div className="p-4 flex-1 flex flex-col space-y-3.5">
        <div>
          <h4 className="font-display font-bold text-slate-800 line-clamp-1 leading-tight flex items-center gap-1.5" id={`card-name-${submission.id}`}>
            <User className="w-4 h-4 text-indigo-600 shrink-0" />
            {submission.name}
          </h4>
          <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1 flex items-center gap-1.5" id={`card-project-${submission.id}`}>
            <Presentation className="w-4 h-4 text-slate-400 shrink-0" />
            {submission.projectName}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-2.5 bg-slate-50 px-2 rounded-lg">
          <div className="flex items-center gap-1.5 text-slate-600">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate font-medium" id={`card-class-${submission.id}`}>{submission.class}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Hash className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate font-mono font-medium" id={`card-roll-${submission.id}`}>Roll: {submission.rollNo}</span>
          </div>
        </div>

        {/* Project File attachment display */}
        {submission.projectFileName && (
          <div className="flex items-center justify-between p-2 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 rounded-lg text-xs mt-1 transition-colors">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <FileDown className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
              <span className="truncate font-bold text-emerald-950 text-[11px]" title={submission.projectFileName}>
                {submission.projectFileName}
              </span>
            </div>
            <button
              onClick={handleDownloadFile}
              type="button"
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-md flex items-center gap-0.5 cursor-pointer shadow-xs shrink-0 transition-colors"
              title="Get autorenamed student code/report file"
            >
              <Download className="w-3 w-3" />
              File
            </button>
          </div>
        )}

        {/* Controls footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg p-1">
              <span className="text-[10px] font-bold text-red-700 px-1">Delete?</span>
              <button
                onClick={() => onDelete(submission.id)}
                type="button"
                className="px-2 py-1 bg-red-650 hover:bg-red-700 text-white text-[10px] font-black rounded-md cursor-pointer transition-colors"
                id={`card-del-confirm-${submission.id}`}
              >
                Yes
              </button>
              <button
                onClick={() => setIsConfirmingDelete(false)}
                type="button"
                className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-md cursor-pointer transition-colors"
                id={`card-del-cancel-${submission.id}`}
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              type="button"
              className="p-2 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
              title="Delete from database"
              id={`card-del-${submission.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => onView(submission)}
              type="button"
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-all"
              id={`card-view-lbl-${submission.id}`}
            >
              View & Grade
            </button>

            <button
              onClick={() => onPrint(submission)}
              type="button"
              className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold rounded-lg border border-transparent hover:border-indigo-100 cursor-pointer flex items-center gap-1 transition-all"
              id={`card-print-lbl-${submission.id}`}
            >
              <Printer className="w-3.5 h-3.5" />
              Report
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
