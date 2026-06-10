/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Submission } from '../types';

interface PrintTemplateProps {
  submission: Submission | null;
  orientation: 'landscape' | 'portrait';
}

export default function PrintTemplate({ submission, orientation }: PrintTemplateProps) {
  if (!submission) return null;

  return (
    <div 
      id="print-document-root" 
      className={`hidden print:flex flex-col justify-between print-card font-sans max-w-4xl mx-auto bg-white text-black border-4 border-double border-slate-800 ${
        orientation === 'landscape' ? 'p-2.5' : 'p-5'
      }`}
      style={{ 
        height: '100vh',
        boxSizing: 'border-box' 
      }}
    >
      <style>{`
        @media print {
          @page {
            size: ${orientation};
            margin: ${orientation === 'landscape' ? '3mm 4mm' : '6mm 8mm'};
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
        }
      `}</style>
      
      {/* Upper header with school portal details */}
      <div className={`flex justify-between items-center border-b border-slate-400 ${
        orientation === 'landscape' ? 'pb-1 mb-1.5' : 'pb-2 mb-3'
      }`}>
        <div>
          <span className="text-[7.5px] font-bold uppercase tracking-widest text-slate-500 block">Academic Record</span>
          <h1 className={`font-black uppercase tracking-tight text-slate-900 font-display ${
            orientation === 'landscape' ? 'text-xs' : 'text-base'
          }`}>
            Project Submission Report
          </h1>
        </div>
        <div className="text-right">
          <span className="text-[7.5px] font-bold uppercase tracking-widest text-slate-500 block">Report UID</span>
          <span className="font-mono text-[8px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
            {submission.id.substring(0, 12).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Compact Horizontal Student Information Bar (Maximized space for screenshot) */}
      <div className="flex flex-row items-stretch justify-between border border-slate-300 rounded bg-slate-50 text-left text-[10px] w-full shrink-0 mb-2 font-sans overflow-hidden">
        <div className="flex-1 p-2 border-r border-slate-200 min-w-0">
          <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Student Name</span>
          <span className="font-extrabold text-slate-900 text-[10.5px] block truncate">{submission.name}</span>
        </div>
        <div className="flex-1 p-2 border-r border-slate-200 min-w-0">
          <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Project Title</span>
          <span className="font-extrabold text-indigo-700 text-[10.5px] block truncate">{submission.projectName}</span>
        </div>
        <div className="p-2 border-r border-slate-200 shrink-0 w-24">
          <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Class / Section</span>
          <span className="font-bold text-slate-800 text-[10.5px] block">{submission.class}</span>
        </div>
        <div className="p-2 border-r border-slate-200 shrink-0 w-24">
          <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Roll Number</span>
          <span className="font-bold text-slate-800 text-[10.5px] block font-mono">Roll No #{submission.rollNo}</span>
        </div>
        <div className="p-2 shrink-0 w-44">
          <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Submission Date</span>
          <span className="font-medium text-slate-700 text-[9px] block">
            {new Date(submission.createdAt).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </span>
        </div>
      </div>

      {/* Embedded Screenshot Section */}
      <div className="flex flex-col flex-1 min-h-0 mb-2">
        <span className="text-[6.5px] uppercase font-extrabold tracking-widest text-slate-400 block mb-0.5">
          Project Screenshot Proof (Main Content)
        </span>
        <div className="w-full bg-slate-50 rounded-md overflow-hidden border border-slate-200 flex items-center justify-center p-1 flex-1 min-h-[400px] h-full">
          <img
            src={submission.screenshot}
            alt={`${submission.name} screenshot`}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[85vh] object-contain rounded w-full h-full"
          />
        </div>
      </div>

      {/* Teacher Grading & Official Signature block */}
      <div className="grid grid-cols-2 gap-4 border-t border-slate-300 pt-1.5 mt-auto shrink-0">
        {/* Grade Block on the left side of footer */}
        <div className="flex flex-col justify-end">
          <div className="inline-block bg-slate-50 border border-slate-300 rounded px-2.5 py-1 w-36 shadow-[0px_1px_2px_rgba(0,0,0,0.02)]">
            <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Assigned Grade</span>
            <span className="text-[10px] font-bold text-indigo-700">
              {submission.grade ? `Grade: ${submission.grade}` : 'Grade: _____________'}
            </span>
          </div>
        </div>

        {/* Classroom Teacher Signature on the right side of footer */}
        <div className="flex flex-col justify-end text-right pl-6">
          <div className="space-y-1">
            <div className="pt-2">
              <div className="border-b border-slate-400 w-36 ml-auto my-0.5" />
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-800 block">
                Classroom Teacher Signature
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
