/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Printer, 
  Grid, 
  Trash2, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  BookOpen, 
  Users, 
  CloudCheck, 
  ServerCrash,
  Download,
  X,
  Award,
  Eye,
  FileText,
  FileCode,
  Check
} from 'lucide-react';
import JSZip from 'jszip';
import { Submission } from '../types';
import SubmissionCard from './SubmissionCard';

interface TeacherPortalProps {
  submissions: Submission[];
  onPrint: (submission: Submission) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  isCloudActive: boolean;
  onUpdateGrade: (id: string, grade: string) => void;
}

export default function TeacherPortal({
  submissions,
  onPrint,
  onDelete,
  onClearAll,
  isCloudActive,
  onUpdateGrade
}: TeacherPortalProps) {
  // Viewer states
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [viewTab, setViewTab] = useState<'screenshot' | 'file'>('screenshot');
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [showGradeSuccess, setShowGradeSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('teacher_authenticated') === 'true';
    }
    return false;
  });
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [searchText, setSearchText] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');

  const checkPinCode = (input: string) => {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (h << 5) - h + input.charCodeAt(i);
      h |= 0;
    }
    return h === 1508447; // Secure hash representation of PIN code "1121"
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPinCode(pinCode)) {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('teacher_authenticated', 'true');
      }
      setPinError(false);
    } else {
      setPinError(true);
      setPinCode('');
      // Vibrate if mobile
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(150);
      }
    }
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('teacher_authenticated');
    }
  };

  // Predefined options of classes
  const classesList = ['All', '3A', '3B', '4A', '4B', '5A', '5B', ...Array.from(new Set(submissions.map(s => s.class))).filter(c => c && !['3A', '3B', '4A', '4B', '5A', '5B'].includes(c))];

  // Filter logic
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchText.toLowerCase()) ||
      sub.projectName.toLowerCase().includes(searchText.toLowerCase()) ||
      sub.rollNo.toLowerCase().includes(searchText.toLowerCase());

    const matchesClass = selectedClass === 'All' || sub.class === selectedClass;

    return matchesSearch && matchesClass;
  });

  const decodeBase64ToText = (base64Str?: string) => {
    if (!base64Str) return '';
    try {
      const actualBase64 = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
      const decoded = atob(actualBase64);
      return decoded;
    } catch (e) {
      return 'Unable to decode file content as text.';
    }
  };

  const isTextFile = (filename?: string) => {
    if (!filename) return false;
    const ext = filename.split('.').pop()?.toLowerCase();
    const textExtensions = ['py', 'js', 'html', 'css', 'txt', 'json', 'ts', 'c', 'cpp', 'java', 'cs', 'sh', 'md', 'xml', 'yaml', 'yml'];
    return ext ? textExtensions.includes(ext) : false;
  };

  const handleOpenViewer = (sub: Submission) => {
    setSelectedSub(sub);
    setGradeInput(sub.grade || '');
    setViewTab(sub.projectFileName && isTextFile(sub.projectFileName) ? 'file' : 'screenshot');
    setShowGradeSuccess(false);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    try {
      setIsSubmittingGrade(true);
      await onUpdateGrade(selectedSub.id, gradeInput.toUpperCase().trim());
      setSelectedSub(prev => prev ? { ...prev, grade: gradeInput.toUpperCase().trim() } : null);
      setShowGradeSuccess(true);
      setTimeout(() => {
        setShowGradeSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Grade submit failed:", err);
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  // Handle master download of all visible rows (zipped in a single robust download pack)
  const handleDownloadAll = async () => {
    if (filteredSubmissions.length === 0) return;
    
    try {
      const zip = new JSZip();
      
      filteredSubmissions.forEach((submission) => {
        const sanitizeName = (val: string) => val.replace(/[\/\\:*?"<>|]/g, '-').trim();
        const fName = sanitizeName(submission.name);
        const fProject = sanitizeName(submission.projectName);
        const fClass = sanitizeName(submission.class);
        const fRoll = sanitizeName(submission.rollNo);
        
        // 1. Pack Screenshot Proof
        let screenshotBase64 = submission.screenshot;
        if (screenshotBase64.includes(',')) {
          screenshotBase64 = screenshotBase64.split(',')[1];
        }
        const imgFilename = `${fName}_${fProject}_${fClass}_${fRoll}.jpg`;
        zip.file(imgFilename, screenshotBase64, { base64: true });
        
        // 2. Pack code file attachment if one exists
        if (submission.projectFileName && submission.projectFileContent) {
          let projectBase64 = submission.projectFileContent;
          if (projectBase64.includes(',')) {
            projectBase64 = projectBase64.split(',')[1];
          }
          const origFilename = sanitizeName(submission.projectFileName);
          const zipProjFilename = `${fName}_${fProject}_${fClass}_${fRoll}_src_${origFilename}`;
          zip.file(zipProjFilename, projectBase64, { base64: true });
        }
      });
      
      const zipContent = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipContent);
      const link = document.createElement('a');
      link.href = url;
      
      const classSuffix = selectedClass === 'All' ? 'All_Classes' : `Class_${selectedClass.replace(/\s+/g, '_')}`;
      link.download = `Submissions_Bulk_${classSuffix}.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Bulk ZIP compilation aborted or failed, initiating fallback sequential method:", err);
      // Fallback: Safe legacy base64-to-blob sequential downloader
      const downloadDataUrl = (dataurl: string, filename: string) => {
        try {
          const arr = dataurl.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
          const bstr = atob(arr[1] || arr[0]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {
          const a = document.createElement('a');
          a.href = dataurl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      };

      filteredSubmissions.forEach((submission, index) => {
        setTimeout(() => {
          const sanitizeName = (val: string) => val.replace(/[\/\\:*?"<>|]/g, '-').trim();
          const filename = `${sanitizeName(submission.name)}_${sanitizeName(submission.projectName)}_${sanitizeName(submission.class)}_${sanitizeName(submission.rollNo)}.jpg`;
          downloadDataUrl(submission.screenshot, filename);
        }, index * 450);
      });
    }
  };

  // Secure Lock Area inside student views
  if (!isAuthenticated) {
    return (
      <div id="teacher-lock-screen" className="max-w-md mx-auto my-12 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="font-display font-bold text-xl text-slate-800">Teacher Dashboard PIN</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
            Please enter your 4-digit PIN to access student submissions, rename downloads, and invoke prints.
          </p>

          <form onSubmit={handlePinSubmit} className="mt-6 w-full space-y-4">
            <div className="space-y-1">
              <input
                type="password"
                maxLength={4}
                value={pinCode}
                onChange={(e) => {
                  setPinError(false);
                  setPinCode(e.target.value.replace(/\D/g, ''));
                }}
                placeholder="••••"
                className={`block w-full text-center tracking-[1rem] font-bold text-2xl py-3 rounded-lg border outline-hidden transition-all ${
                  pinError 
                    ? 'border-red-400 focus:ring-red-500/20 bg-red-50 text-red-700 animate-pulse' 
                    : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50'
                }`}
                autoFocus
                id="teacher-pin-field"
              />
              {pinError && (
                <p className="text-xs font-semibold text-red-600 mt-1 flex items-center justify-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Incorrect PIN. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              id="pin-submit-btn"
              disabled={pinCode.length !== 4}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer transition-all shadow-lg shadow-indigo-100"
            >
              Verify PIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="teacher-portal-view" className="space-y-6">
      {/* Real-time status header and Controls bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl shrink-0">
            <Unlock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg text-slate-800">Teacher Control Deck</h3>
              <button
                onClick={handleSignOut}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 font-bold px-2 py-1 rounded text-slate-500 transition-colors cursor-pointer"
                id="relock-btn"
              >
                Sign Out
              </button>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              {isCloudActive ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-green-550 animate-ping" />
                  <span className="text-indigo-600 font-bold">Active Cloud Sync</span>
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-700 font-semibold">Local Storage Sandboxed</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Counter cards and bulk tools */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Total Subs Metric */}
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center min-w-[100px]">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-indigo-600" /> Students
            </div>
            <div className="text-lg font-bold text-slate-800 mt-0.5 leading-none">
              {submissions.length}
            </div>
          </div>

          {/* Classes Metric */}
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center min-w-[100px]">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <BookOpen className="w-3 h-3 text-indigo-600" /> Classes
            </div>
            <div className="text-lg font-bold text-slate-800 mt-0.5 leading-none">
              {classesList.length - 1}
            </div>
          </div>

          {/* Clear Database button */}
          {submissions.length > 0 && (
            <button
              onClick={() => {
                if (confirm("⚠️ CRITICAL WARNING: This will permanently delete ALL submitted student projects from your portal! Are you absolutely sure?")) {
                  onClearAll();
                }
              }}
              type="button"
              id="clear-db-btn"
              className="p-2.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Delete all submissions"
            >
              <Trash2 className="w-4 h-4" />
              Clear Portal
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search controllers panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search fields */}
        <div className="md:col-span-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by student name, roll number, or project..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 bg-slate-50 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all placeholder:text-slate-400 font-medium"
            id="student-search-input"
          />
        </div>

        {/* Dropdowns fields */}
        <div className="md:col-span-3 flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0" htmlFor="class-select-filter">Class:</label>
          <select
            id="class-select-filter"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="block w-full px-3.5 py-2.5 text-sm border border-slate-200 bg-slate-50 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all cursor-pointer text-slate-700 font-medium"
          >
            {classesList.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        {/* Bulk Action Download All */}
        <div className="md:col-span-3">
          <button
            onClick={handleDownloadAll}
            disabled={filteredSubmissions.length === 0}
            type="button"
            id="bulk-dl-btn"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            Download {filteredSubmissions.length} Visible
          </button>
        </div>
      </div>

      {/* Grid of student listing cards */}
      <AnimatePresence mode="popLayout">
        {filteredSubmissions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            id="empty-results-fallback"
            className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-450 shadow-xs"
          >
            <Grid className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="font-display font-medium text-slate-700 text-base">No submissions found</p>
            <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto">
              {submissions.length === 0 
                ? 'Wait for students to visit this page and paste their project screenshots.'
                : 'Try adjusting your search criteria or selecting a different class filter.'}
            </p>
          </motion.div>
        ) : (
          <div id="submissions-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onPrint={onPrint}
                onDelete={onDelete}
                onView={handleOpenViewer}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Viewer & Inline Grading Dialog */}
      <AnimatePresence>
        {selectedSub && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-xs">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-sm md:text-base leading-tight">
                      Submission Viewer: {selectedSub.name}
                    </h2>
                    <p className="text-[10px] text-slate-405">
                      Class {selectedSub.class} • Roll #{selectedSub.rollNo} • Project: {selectedSub.projectName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Close viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Main Content Area - Split Pane */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0 bg-slate-50">
                {/* Left side: View Tabs (Screenshot Proof or Code File) - col-span-7 */}
                <div className="lg:col-span-7 flex flex-col p-4 border-r border-slate-200 min-h-0 bg-slate-100/50">
                  {/* Selector tabs if student uploaded a plain-text file */}
                  {selectedSub.projectFileName && isTextFile(selectedSub.projectFileName) ? (
                    <div className="flex items-center gap-1.5 mb-2.5 bg-slate-200/65 p-1 rounded-lg self-start text-xs font-bold leading-none">
                      <button
                        onClick={() => setViewTab('screenshot')}
                        type="button"
                        className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                          viewTab === 'screenshot' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        Screenshot proof
                      </button>
                      <button
                        onClick={() => setViewTab('file')}
                        type="button"
                        className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                          viewTab === 'file' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        Source code ({selectedSub.projectFileName.split('.').pop()?.toUpperCase()})
                      </button>
                    </div>
                  ) : null}

                  {/* Active Display Panel */}
                  <div className="flex-1 flex flex-col justify-center min-h-[350px]">
                    {viewTab === 'screenshot' ? (
                      <div className="w-full h-full bg-slate-900 text-slate-400 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center p-1 relative shadow-sm max-h-[55vh]">
                        <img
                          src={selectedSub.screenshot}
                          alt="Screenshot Proof"
                          className="max-w-full max-h-[52vh] object-contain rounded"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 rounded-lg overflow-hidden border border-slate-900 shadow-sm max-h-[55vh]">
                        <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-450">
                          <span className="flex items-center gap-1.5 font-bold"><FileCode className="w-4 h-4 text-emerald-500" /> {selectedSub.projectFileName}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(decodeBase64ToText(selectedSub.projectFileContent));
                              alert("Code copied to clipboard!");
                            }}
                            className="hover:text-white font-bold bg-slate-800 px-2.5 py-1 rounded transition-all text-[10px]"
                          >
                            Copy code
                          </button>
                        </div>
                        <pre className="flex-1 p-4 overflow-auto text-left font-mono text-xs leading-relaxed text-emerald-400 select-text bg-slate-950 whitespace-pre-wrap">
                          {decodeBase64ToText(selectedSub.projectFileContent)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Grading Form and Controls - col-span-5 */}
                <div className="lg:col-span-12 xl:col-span-5 p-5 flex flex-col justify-between space-y-6">
                  {/* Part A: Grading & Rubrics card */}
                  <div className="space-y-4">
                    <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-xs text-slate-500 font-medium">
                      <span className="font-extrabold uppercase text-[10px] tracking-wide text-indigo-700 block mb-1">Submissions Rubric</span>
                      Assess completeness of instructions, proof of screenshot output matching the task description, and overall clean execution of files.
                    </div>

                    <div className="border border-slate-200 rounded-xl bg-white p-4.5 shadow-3xs">
                      <div className="flex items-center gap-2 mb-3.5">
                        <Award className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-display font-extrabold text-sm text-slate-800">Assign Grade</h4>
                      </div>

                      <form onSubmit={handleSaveGrade} className="space-y-3.5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider" htmlFor="grade-input-box">
                            Assigned Grade (e.g. A+, Grade 9, 95/100, etc.)
                          </label>
                          <input
                            type="text"
                            placeholder="Grade"
                            maxLength={12}
                            value={gradeInput}
                            onChange={(e) => setGradeInput(e.target.value)}
                            className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden tracking-wide text-sm font-bold text-slate-800 focus:bg-white transition-all"
                            id="grade-input-box"
                            required
                          />
                        </div>

                        {/* Quick preset chips */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {['A+', 'A', 'B', 'C', 'Pass', 'Fail'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setGradeInput(preset)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded text-xs font-bold text-slate-600 cursor-pointer transition-all border border-transparent hover:border-indigo-100"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingGrade}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 border-b-2 border-indigo-800 shadow-md"
                          id="save-grade-btn"
                        >
                          {showGradeSuccess ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-300 animate-bounce" />
                              Grade Saved Successfully!
                            </>
                          ) : (
                            <>
                              Save Grade
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Part B: Prints and Export controls */}
                  <div className="space-y-2.5 mt-auto">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Production and printing Tools</span>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => {
                          const sanitizeName = (val: string) => val.replace(/[\/\\:*?"<>|]/g, '-').trim();
                          const fName = sanitizeName(selectedSub.name);
                          const fProject = sanitizeName(selectedSub.projectName);
                          const fClass = sanitizeName(selectedSub.class);
                          const fRoll = sanitizeName(selectedSub.rollNo);
                          
                          const link = document.createElement('a');
                          link.href = selectedSub.screenshot;
                          link.download = `${fName}_${fProject}_${fClass}_${fRoll}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="py-2.5 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all shadow-3xs"
                      >
                        <Download className="w-4 h-4 text-slate-400" />
                        Screenshot
                      </button>

                      {selectedSub.projectFileName && (
                        <button
                          onClick={() => {
                            const sanitizeName = (val: string) => val.replace(/[\/\\:*?"<>|]/g, '-').trim();
                            const fName = sanitizeName(selectedSub.name);
                            const fProject = sanitizeName(selectedSub.projectName);
                            const fClass = sanitizeName(selectedSub.class);
                            const fRoll = sanitizeName(selectedSub.rollNo);
                            const origFilename = sanitizeName(selectedSub.projectFileName || '');
                            
                            const arr = (selectedSub.projectFileContent || '').split(',');
                            const mimeMatch = arr[0].match(/:(.*?);/);
                            const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
                            const bstr = atob(arr[1] || arr[0]);
                            let n = bstr.length;
                            const u8arr = new Uint8Array(n);
                            while (n--) {
                              u8arr[n] = bstr.charCodeAt(n);
                            }
                            const blob = new Blob([u8arr], { type: mime });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${fName}_${fProject}_${fClass}_${fRoll}_${origFilename}`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                          }}
                          className="py-2.5 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all shadow-3xs"
                        >
                          <Download className="w-4 h-4 text-slate-400" />
                          Code File
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSub(null); // Close this modal first
                        onPrint(selectedSub); // Open Print Modal
                      }}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <Printer className="w-4 h-4" />
                      Print Preview & Save Report PDF (Orientation)
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="bg-slate-900 text-slate-450 border-t border-slate-800 px-5 py-3 font-mono text-[9px] flex justify-between shrink-0">
                <span>DATABASE CLOUD SYNC: {isCloudActive ? 'CONNECTED' : 'LOCAL CACHE ONLY'}</span>
                <span>SUB_ID: {selectedSub.id}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


