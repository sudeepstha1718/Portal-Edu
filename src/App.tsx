/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  BookOpen, 
  Printer, 
  Send, 
  Lock, 
  Database,
  ArrowRight,
  CheckCircle,
  Clock,
  LogOut,
  Sliders,
  Award,
  Plus,
  X,
  ExternalLink,
  FileDown,
  FileUp,
  Download
} from 'lucide-react';
import { Submission } from './types';
import { persistence } from './lib/persistence';
import PasteField from './components/PasteField';
import StudentForm from './components/StudentForm';
import TeacherPortal from './components/TeacherPortal';
import PrintTemplate from './components/PrintTemplate';

export default function App() {
  // Navigation View modes
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  
  // Real-time student submission state stream
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isCloudActive, setIsCloudActive] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Student Input State
  const [name, setName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [classVal, setClassVal] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [screenshot, setScreenshot] = useState(''); // base64 JPEG
  const [projectFileName, setProjectFileName] = useState('');
  const [projectFileContent, setProjectFileContent] = useState(''); // base64 string
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Active printing state target
  const [printableSubmission, setPrintableSubmission] = useState<Submission | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // Stream submissions in real-time
  useEffect(() => {
    setIsCloudActive(persistence.isCloudEnabled());
    
    const unsubscribe = persistence.subscribeSubmissions((data) => {
      setSubmissions(data);
    });

    return () => unsubscribe();
  }, []);

  // Form validations
  const validateForm = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!name.trim()) tempErrors.name = "Please enter your full name";
    if (!projectName.trim()) tempErrors.projectName = "Please describe or state your project name";
    if (!classVal.trim()) tempErrors.classVal = "Please fill in your class or grade";
    if (!rollNo.trim()) tempErrors.rollNo = "Roll Number is required";
    if (!screenshot) tempErrors.screenshot = "A project screenshot is required. Please copy-paste (Ctrl+V) or upload.";
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      
      await persistence.saveSubmission({
        name: name.trim(),
        projectName: projectName.trim(),
        class: classVal.trim(),
        rollNo: rollNo.trim(),
        screenshot: screenshot,
        projectFileName: projectFileName,
        projectFileContent: projectFileContent,
      });

      // Clear screenshot and optional project files, retaining class value for quick computer lab rotations!
      setScreenshot('');
      setName('');
      setProjectName('');
      setRollNo('');
      setProjectFileName('');
      setProjectFileContent('');
      setErrors({});
      setSubmitSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please check your network connection or try resizing your screenshot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Immediate Single-Submission Print
  const handlePrint = (submission: Submission) => {
    setPrintableSubmission(submission);
    setShowPrintModal(true);
  };

  // Helper to open a clean standalone window which automatically prints.
  // This is the absolute best workaround to bypass sandboxed iframe restrictions!
  const handleTriggerBrowserPrint = (submission: Submission, orientation: 'portrait' | 'landscape' = 'landscape') => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error("Popup blocked");
      }

      const dateStr = new Date(submission.createdAt).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Writes a self-contained document styled with high-contrast print rules.
      // Margin: 0 tells the browser to strip all native print URLs, page numbers, & workspace headers!
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Student Project Submission Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Inter:wght@400;500;700;800&family=Fira+Code:wght@500&display=swap');
            
            @page {
              size: ${orientation};
              margin: 0; /* Strips browser headers, footers, page numbers and links completely */
            }
            
            @media print {
              html, body {
                height: 100vh;
                margin: 0;
                padding: 0;
                overflow: hidden;
              }
            }
            
            body {
              font-family: 'Inter', sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              margin: 0;
              padding: ${orientation === 'landscape' ? '3mm 4mm' : '6mm 8mm'}; /* Optimal padding depending on orientation */
              box-sizing: border-box;
              height: 100vh;
              overflow: hidden;
            }
            
            .print-card {
              max-width: 100%;
              margin: 0 auto;
              border: 4px double #1e293b;
              padding: ${orientation === 'landscape' ? '8px 10px' : '16px 20px'};
              box-sizing: border-box;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
            }

            .flex-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .border-b {
              border-bottom: 2px solid #1e293b;
              padding-bottom: ${orientation === 'landscape' ? '2px' : '4px'};
              margin-bottom: ${orientation === 'landscape' ? '4px' : '8px'};
            }

            .text-title {
              font-family: 'Plus Jakarta Sans', sans-serif;
              font-size: ${orientation === 'landscape' ? '12px' : '15px'};
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: -0.025em;
              color: #0f172a;
              margin: 4px 0 0 0;
            }

            .text-label {
              font-size: 7.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #64748b;
            }

            .uid-badge {
              font-family: 'Fira Code', monospace;
              font-size: 8px;
              font-weight: 700;
              background-color: #f1f5f9;
              padding: 2px 6px;
              border-radius: 4px;
              color: #1e293b;
            }

            .grid {
              display: grid;
              grid-template-cols: ${orientation === 'landscape' ? '1.5fr 1.5fr 1fr 1fr 1.5fr' : '1fr 1fr'};
              gap: 4px;
              margin-bottom: ${orientation === 'landscape' ? '4px' : '8px'};
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              padding: ${orientation === 'landscape' ? '4px 8px' : '6px 10px'};
              background-color: #f8fafc;
            }

            .grid-item {
              display: flex;
              flex-direction: column;
            }

            ${orientation === 'portrait' ? `
              .grid-item.row-2 {
                border-top: 1px solid #e2e8f0;
                padding-top: 4px;
                margin-top: 4px;
              }
            ` : ''}

            .val-large {
              font-size: ${orientation === 'landscape' ? '9px' : '11px'};
              font-weight: 800;
              color: #0f172a;
              margin-top: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .val-normal {
              font-size: ${orientation === 'landscape' ? '8px' : '10px'};
              font-weight: 700;
              color: #1e293b;
              margin-top: 2px;
            }

            .screenshot-container {
              margin-top: ${orientation === 'landscape' ? '2px' : '4px'};
              border: 1px solid #cbd5e1;
              background-color: #f8fafc;
              border-radius: 4px;
              padding: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex: 1;
              min-height: 0;
              overflow: hidden;
            }

            .screenshot-img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              border-radius: 4px;
            }

            .footer-row {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 16px;
              border-top: 2px solid #1e293b;
              padding-top: ${orientation === 'landscape' ? '4px' : '8px'};
              margin-top: ${orientation === 'landscape' ? '4px' : '8px'};
            }

            .grade-box {
              background-color: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              padding: ${orientation === 'landscape' ? '3px 6px' : '6px 10px'};
              width: 135px;
            }

            .grade-text {
              font-size: 10px;
              font-weight: 700;
              color: #1e293b;
              margin-top: 2px;
            }

            .sig-area {
              text-align: right;
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
            }

            .sig-line {
              border-bottom: 1.5px solid #1e293b;
              width: 135px;
              margin-left: auto;
              margin-bottom: 4px;
            }

            .sig-title {
              font-size: ${orientation === 'landscape' ? '8.5px' : '10px'};
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #1e293b;
            }

            .sig-date {
              font-size: 8px;
              color: #64748b;
              font-weight: 600;
              margin-top: 2px;
            }
          </style>
        </head>
        <body>
          <div class="print-card">
            <!-- Upper header with school portal details -->
            <div class="flex-row border-b">
              <div>
                <span class="text-label" style="font-size: 7.5px;">Academic Record</span>
                <h1 class="text-title" style="margin-top: 2px;">Project Submission Report</h1>
              </div>
              <div style="text-align: right;">
                <span class="text-label" style="display: block; margin-bottom: 2px;">Report UID</span>
                <span class="uid-badge">${submission.id.substring(0, 12).toUpperCase()}</span>
              </div>
            </div>

            <!-- Grid of Student Details (compact layouts) -->
            <div class="grid">
              ${orientation === 'landscape' ? `
                <div class="grid-item">
                  <span class="text-label">Student Name</span>
                  <span class="val-large">${submission.name}</span>
                </div>
                <div class="grid-item">
                  <span class="text-label">Project Title</span>
                  <span class="val-large">${submission.projectName}</span>
                </div>
                <div class="grid-item">
                  <span class="text-label">Class / Section</span>
                  <span class="val-normal">${submission.class}</span>
                </div>
                <div class="grid-item">
                  <span class="text-label">Roll Number</span>
                  <span class="val-normal font-mono">Roll No #${submission.rollNo}</span>
                </div>
                <div class="grid-item">
                  <span class="text-label">Submission Date</span>
                  <span class="val-normal">${dateStr}</span>
                </div>
              ` : `
                <div class="grid-item">
                  <span class="text-label">Student Name</span>
                  <span class="val-large">${submission.name}</span>
                </div>
                <div class="grid-item">
                  <span class="text-label">Project Title</span>
                  <span class="val-large">${submission.projectName}</span>
                </div>
                <div class="grid-item row-2">
                  <span class="text-label">Class & Roll</span>
                  <span class="val-normal">Class ${submission.class} (Roll #${submission.rollNo})</span>
                </div>
                <div class="grid-item row-2">
                  <span class="text-label">Submission Date</span>
                  <span class="val-normal">${dateStr}</span>
                </div>
              `}
            </div>

            <!-- Embedded Screenshot -->
            <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
              <span class="text-label" style="display: block; font-size: 6px; margin-bottom: 2px;">Project Screenshot Proof (Main Content)</span>
              <div class="screenshot-container">
                <img class="screenshot-img" src="${submission.screenshot}" alt="Screenshot" />
              </div>
            </div>

            <!-- Grade and Teacher Signature Block -->
            <div class="footer-row">
              <div style="display: flex; align-items: flex-end;">
                <div class="grade-box">
                  <span class="text-label">Assigned Grade</span>
                  <div class="grade-text">Grade: _____________</div>
                </div>
              </div>
              <div class="sig-area">
                <div style="padding-top: 4px;">
                  <div class="sig-line"></div>
                  <span class="sig-title">Classroom Teacher Signature</span>
                </div>
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (popupErr) {
      console.warn("Direct window.open popup blocked, triggering direct print fallback:", popupErr);
      try {
        window.print();
      } catch (printErr) {
        console.error("Direct print disallowed by browser context.", printErr);
      }
    }
  };

  // Download Submission as a high-fidelity Microsoft Word (.doc) document preconfigured to Landscape A4 size!
  const handleDownloadWord = (submission: Submission) => {
    const dateStr = new Date(submission.createdAt).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Student Project Submission Report - ${submission.name}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 297mm 210mm; /* Perfect A4 dimensions in Landscape orientation */
            margin: 1.5cm;
            mso-page-orientation: landscape;
          }
          div.Section1 {
            page: Section1;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #0f172a;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .card {
            border: 6px double #1e293b;
            padding: 30px;
            background-color: #ffffff;
          }
          .header-table {
            width: 100%;
            border-bottom: 2px solid #1e293b;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .header-title {
            font-size: 26pt;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            margin: 0;
          }
          .uid-label {
            font-size: 9pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: right;
          }
          .uid-value {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11pt;
            font-weight: bold;
            background-color: #f1f5f9;
            padding: 4px 8px;
            border-radius: 4px;
            color: #1e293b;
            text-align: right;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .info-cell {
            padding: 12px 15px;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            vertical-align: top;
          }
          .label {
            font-size: 8pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            display: block;
          }
          .value-large {
            font-size: 14pt;
            font-weight: 800;
            color: #0f172a;
          }
          .value-normal {
            font-size: 11pt;
            font-weight: bold;
            color: #1e293b;
          }
          .screenshot-section {
            margin-top: 15px;
            margin-bottom: 25px;
          }
          .screenshot-box {
            border: 1px solid #cbd5e1;
            background-color: #f8fafc;
            padding: 15px;
            text-align: center;
          }
          .screenshot-img {
            max-width: 100%;
            height: auto;
            max-height: 400px;
          }
          .footer-table {
            width: 100%;
            border-top: 2px solid #1e293b;
            padding-top: 25px;
            margin-top: 25px;
          }
          .grade-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 12px 18px;
            width: 200px;
          }
          .grade-title {
            font-size: 8pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
          }
          .grade-text {
            font-size: 11pt;
            font-weight: bold;
            color: #1e293b;
            margin-top: 5px;
          }
          .sig-line {
            border-bottom: 2px solid #1e293b;
            width: 250px;
            margin-bottom: 6px;
            display: inline-block;
          }
          .sig-title {
            font-size: 11pt;
            font-weight: bold;
            color: #1e293b;
            text-transform: uppercase;
          }
          .sig-date {
            font-size: 9pt;
            color: #64748b;
            font-weight: bold;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          <div class="card">
            <!-- Upper Header block -->
            <table class="header-table" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align: bottom;">
                  <span class="label" style="margin: 0;">Academic Record</span>
                  <p class="header-title">Project Submission Report</p>
                </td>
                <td align="right" style="vertical-align: bottom;">
                  <p class="uid-label">Report UID</p>
                  <p><span class="uid-value">${submission.id.substring(0, 12).toUpperCase()}</span></p>
                </td>
              </tr>
            </table>

            <!-- Student Demographics Dynamic Details -->
            <table class="info-table" cellpadding="0" cellspacing="0">
              <tr>
                <td class="info-cell" width="50%">
                  <span class="label">Student Name</span>
                  <div class="value-large">${submission.name}</div>
                </td>
                <td class="info-cell" width="50%">
                  <span class="label">Project Title</span>
                  <div class="value-large">${submission.projectName}</div>
                </td>
              </tr>
              <tr>
                <td class="info-cell" style="border-top: none;">
                  <span class="label">Class / Section</span>
                  <div class="value-normal">${submission.class}</div>
                </td>
                <td class="info-cell" style="border-top: none;">
                  <span class="label">Roll Number</span>
                  <div class="value-normal">Roll No #${submission.rollNo}</div>
                </td>
              </tr>
              <tr>
                <td class="info-cell" colspan="2" style="border-top: none;">
                  <span class="label">Date & Time of Submission</span>
                  <div class="value-normal" style="font-size: 11pt;">${dateStr}</div>
                </td>
              </tr>
            </table>

            <!-- Associated Proof Attachment Screenshot image -->
            <div class="screenshot-section">
              <span class="label" style="margin-bottom: 8px; display: block;">Project Screenshot Proof</span>
              <div class="screenshot-box">
                <img class="screenshot-img" src="${submission.screenshot}" alt="Project Screenproof screenshot" />
              </div>
            </div>

            <!-- Authentic Grade and Signature Section -->
            <table class="footer-table" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align: bottom;" width="50%">
                  <div class="grade-box">
                    <span class="grade-title">Assigned Grade</span>
                    <div class="grade-text">Grade: _____________</div>
                  </div>
                </td>
                <td style="vertical-align: bottom; text-align: right;" width="50%">
                  <div class="sig-line"></div><br/>
                  <span class="sig-title">Classroom Teacher Signature</span>
                  <div class="sig-date">Date: ________________________</div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;

    // Convert string to HTML blob and save as .doc
    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Submission_Report_${submission.name.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearAll = async () => {
    const idsToDelete = submissions.map(s => s.id);
    setDeletedIds(prev => {
      const next = new Set(prev);
      idsToDelete.forEach(id => next.add(id));
      return next;
    });
    setSubmissions([]);
    for (const id of idsToDelete) {
      await persistence.deleteSubmission(id);
    }
  };

  const handleDeleteOne = async (id: string) => {
    setDeletedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setSubmissions(prev => prev.filter(sub => sub.id !== id));
    await persistence.deleteSubmission(id);
  };

  const handleUpdateGrade = async (id: string, grade: string) => {
    try {
      await persistence.updateGrade(id, grade);
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, grade } : s));
    } catch (err) {
      console.error("Failed to update grade:", err);
    }
  };

  return (
    <div id="application-layout" className="min-h-screen bg-slate-50 text-slate-950 flex flex-col font-sans transition-colors antialiased">
      
      {/* Header View: Omitted on physical prints */}
      <header id="main-header" className="no-print h-16 bg-white border-b border-slate-200 px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl h-full mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Title and active system indicators */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-extrabold text-lg select-none">
              P
            </div>
            <div>
              <h1 className="font-display font-extrabold text-base md:text-lg text-slate-800 tracking-tight leading-none">
                ProjectPortal <span className="text-indigo-600">Edu</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Automatic Screen Rename & Submit</p>
            </div>
          </div>

          {/* Sleek Top Navigation menu tags */}
          <nav className="flex gap-6 text-sm font-bold text-slate-500 h-full items-center">
            <button
              onClick={() => {
                setViewMode('student');
                setSubmitSuccess(false);
              }}
              type="button"
              className={`h-full border-b-2 px-1 transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'student'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'border-transparent text-slate-450 hover:text-slate-800'
              }`}
              id="student-nav-tab"
            >
              <Send className="w-3.5 h-3.5" />
              Student View
            </button>
            
            <button
              onClick={() => setViewMode('teacher')}
              type="button"
              className={`h-full border-b-2 px-1 transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'teacher'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'border-transparent text-slate-450 hover:text-slate-800'
              }`}
              id="teacher-nav-tab"
            >
              <Lock className="w-3.5 h-3.5" />
              Admin Dashboard
            </button>
          </nav>

        </div>
      </header>

      {/* Primary Workspace container */}
      <main id="primary-container" className="no-print flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          {viewMode === 'student' ? (
            <motion.div
              key="student-space"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto w-full"
            >
              
              {/* Guides column */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden">
                  
                  <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-505" />
                    How to Submit Work
                  </div>

                  <h3 className="font-display font-extrabold text-xl md:text-2xl text-slate-800 leading-tight">
                    Submit Screenshot in Seconds
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed font-medium">
                    State your key identification details, copy your screenshot active window using the system tools, and paste directly on this portal.
                  </p>

                  <div className="mt-6 space-y-5">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-mono text-xs font-extrabold shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs text-slate-550 leading-relaxed font-semibold">
                        <strong className="block text-slate-800 font-bold uppercase text-[10px]">Provide Credentials</strong>
                        Input your complete name, your project title, class standard, and class roll number.
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-mono text-xs font-extrabold shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs text-slate-550 leading-relaxed font-semibold">
                        <strong className="block text-slate-800 font-bold uppercase text-[10px]">PrtScn / Snipping Tool (Ctrl+C)</strong>
                        Capture a snap of your live execution or script output. Copy to clipboard.
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-mono text-xs font-extrabold shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs text-slate-550 leading-relaxed font-semibold">
                        <strong className="block text-slate-800 font-bold uppercase text-[10px]">Paste (Ctrl+V) & Send</strong>
                        Click the capture target zone and press paste. Verify your picture preview, and click Submit.
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-5 border-t border-slate-100 text-center flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <Database className="w-4 h-4 text-indigo-500" />
                    <span>Real-time submission active</span>
                  </div>
                </div>

                {/* Auto Rename Info Widget */}
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-4 shadow-3xs">
                  <div className="w-8 h-8 bg-indigo-200 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">Auto-Rename System Active</h4>
                    <p className="text-xs text-indigo-700 leading-snug font-medium">
                      Student screenshots are systematically renamed upon bulk or individual downloads to: 
                      <code className="bg-indigo-200/40 px-1 py-0.5 rounded ml-1 font-mono">Name_ProjectName_Class_RollNo.jpg</code>
                    </p>
                  </div>
                </div>

                {/* Dashboard statistics link helper */}
                <div className="hidden lg:block bg-white border border-slate-200 rounded-xl p-5 text-center shadow-xs">
                  <p className="text-xs text-slate-400 leading-relaxed font-bold uppercase tracking-wider">
                    Are you the classroom teacher?
                  </p>
                  <button
                    onClick={() => setViewMode('teacher')}
                    type="button"
                    className="mt-2.5 inline-flex items-center gap-1 cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    View student submissions logs
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Form/Action column */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-xs">
                
                <AnimatePresence mode="wait">
                  {!submitSuccess ? (
                    <motion.form 
                      key="submission-form"
                      onSubmit={handleSubmit} 
                      className="space-y-6"
                    >
                      <StudentForm
                        name={name}
                        setName={setName}
                        projectName={projectName}
                        setProjectName={setProjectName}
                        classVal={classVal}
                        setClassVal={setClassVal}
                        rollNo={rollNo}
                        setRollNo={setRollNo}
                        errors={errors}
                      />

                      <div className="border-t border-slate-100 pt-5">
                        <PasteField
                          screenshot={screenshot}
                          onScreenshotChange={setScreenshot}
                        />
                        {errors.screenshot && (
                          <p className="text-xs font-medium text-red-600 mt-1.5" id="screenshot-error-msg">{errors.screenshot}</p>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-5">
                        <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-2">
                          <FileUp className="w-4 h-4 text-emerald-500 animate-bounce" />
                          Project Code / File Attachment (Optional)
                        </label>
                        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center hover:border-emerald-300 hover:bg-emerald-50/10 transition-all">
                          {projectFileName ? (
                            <div className="w-full flex items-center justify-between bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-lg text-emerald-900">
                              <div className="flex items-center gap-2.5 truncate">
                                <FileDown className="w-5 h-5 text-emerald-600 shrink-0 animate-pulse" />
                                <div className="text-left truncate">
                                  <p className="text-xs font-extrabold truncate">{projectFileName}</p>
                                  <p className="text-[10px] text-emerald-600 font-bold">Ready to bundle securely & renamed!</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setProjectFileName('');
                                  setProjectFileContent('');
                                }}
                                className="p-1.5 px-3 hover:bg-emerald-100 text-emerald-800 text-[11px] font-extrabold rounded-md cursor-pointer transition-colors"
                              >
                                Remove File
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              <p className="text-xs text-slate-500 font-medium">
                                Drag & drop or upload any project files (.zip, .pdf, .docx, or code files)
                              </p>
                              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                                <FileUp className="w-3.5 h-3.5 text-slate-500" />
                                Choose File
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const files = e.target.files;
                                    if (files && files.length > 0) {
                                      const file = files[0];
                                      // Limit to 4MB to prevent excessive memory/firestore limits
                                      if (file.size > 4 * 1024 * 1024) {
                                        alert("File is too large. Please select a file smaller than 4MB.");
                                        return;
                                      }
                                      
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        const result = reader.result as string;
                                        setProjectFileName(file.name);
                                        setProjectFileContent(result);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-5 flex justify-end">
                        <button
                          type="submit"
                          id="student-submit-btn"
                          disabled={isSubmitting}
                          className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-100 active:scale-98 transition-all w-full sm:w-auto"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Submitting Screencast...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send Project Submission
                            </>
                          )}
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.div
                      key="success-form"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12 px-4"
                      id="student-success-card"
                    >
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-xs">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      
                      <h2 className="font-display font-extrabold text-2xl text-slate-800">
                        Project Submitted Successfully!
                      </h2>
                      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                        Excellent work! Your credentials and screenshot have been recorded in the teacher's pool. Your instructor can now download and print it.
                      </p>

                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            setSubmitSuccess(false);
                            // Keep classVal for next student convenience
                            setName('');
                            setProjectName('');
                            setRollNo('');
                            setScreenshot('');
                          }}
                          type="button"
                          id="submit-another-btn"
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-100 transition-all"
                        >
                          <Plus className="w-4 h-4 text-white" />
                          Submit Another Project
                        </button>
                        
                        <button
                          onClick={() => setSubmitSuccess(false)}
                          type="button"
                          id="inspect-submission"
                          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg cursor-pointer transition-all"
                        >
                          View Form Details
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

            </motion.div>
          ) : (
            <motion.div
              key="teacher-space"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <TeacherPortal
                submissions={submissions.filter(sub => !deletedIds.has(sub.id))}
                onPrint={handlePrint}
                onDelete={handleDeleteOne}
                onClearAll={handleClearAll}
                isCloudActive={isCloudActive}
                onUpdateGrade={handleUpdateGrade}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Page Footer: Omitted on prints */}
      <footer id="main-footer" className="no-print bg-slate-100 border-t border-slate-205 py-4 text-xs text-slate-450 mt-auto font-medium">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 ProjectPortal Edu • Auto-Rename Offline Sync Enabled</p>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 uppercase font-semibold text-[10px] tracking-wider text-slate-400">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${isCloudActive ? 'bg-green-550' : 'bg-gray-400'}`} />
              Database status: {isCloudActive ? 'Cloud Sync active' : 'Local Sandbox'}
            </span>
            <span className="text-slate-300">|</span>
            <a href="#" onClick={(e) => { e.preventDefault(); setViewMode(viewMode === 'student' ? 'teacher' : 'student') }} className="hover:text-indigo-600 transition-colors uppercase font-bold text-[10px] tracking-wider">
              Access Gate
            </a>
          </div>
        </div>
      </footer>

      {/* Hidden layout rendered exclusively during physical printing (win+p) */}
      <PrintTemplate submission={printableSubmission} orientation={printOrientation} />

      {/* Interactive In-App Print Preview & Iframe-Bypass dialog */}
      <AnimatePresence>
        {showPrintModal && printableSubmission && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h2 className="font-display font-extrabold text-sm md:text-base tracking-tight">Print Report Preview & Setup</h2>
                    <p className="text-[10px] text-slate-400">Student: {printableSubmission.name} • Class: {printableSubmission.class}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close Preview Window"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Advanced Guidelines Sandbox Warning */}
              <div className="bg-amber-50 border-b border-amber-100 p-3 text-xs text-amber-800 flex items-start gap-2.5">
                <div className="w-5 h-5 bg-amber-100 text-amber-700 rounded-md flex items-center justify-center font-bold shrink-0">
                  !
                </div>
                <div className="space-y-1">
                  <p className="font-extrabold uppercase text-[10px] tracking-wide text-amber-900 leading-none">Developer Sandbox Print Guard Notice</p>
                  <p className="font-medium text-[11px] leading-relaxed">
                    Because this workspace runs in an interactive live browser <strong className="font-bold">Sandbox iFrame</strong>, browsers sometimes block the standard print prompt. If clicking the trigger button does not open your printer settings, please use these quick workarounds:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] font-semibold text-amber-900/90 pl-1">
                    <li><strong className="font-bold">Workaround A (Easiest):</strong> Simply click inside the white document below to focus it, then press <kbd className="bg-amber-200/50 px-1 rounded font-mono">Win + P</kbd> (or <kbd className="bg-amber-200/50 px-1 rounded font-mono">Cmd + P</kbd>) or right-click the white card and select <strong className="font-bold">Print</strong>.</li>
                    <li><strong className="font-bold">Workaround B (Sandbox-Free):</strong> Click the <strong className="font-bold">Open App in New Tab</strong> icon at the top of the AI Studio window to run without iframe restrictions.</li>
                  </ul>
                </div>
              </div>

              {/* Report Layout Customizer Tab Group */}
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Report Layout settings:</span>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Selected Orientation:</span>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-3xs">
                    <button
                      onClick={() => setPrintOrientation('portrait')}
                      type="button"
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        printOrientation === 'portrait'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Portrait
                    </button>
                    <button
                      onClick={() => setPrintOrientation('landscape')}
                      type="button"
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        printOrientation === 'landscape'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Landscape (Recommended)
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Interactive Preview Pane */}
              <div className="flex-1 bg-slate-100 p-6 overflow-y-auto flex justify-center">
                <div 
                  className={`bg-white shadow-xl w-full border-4 border-double border-slate-800 relative select-text transition-all duration-300 ${
                    printOrientation === 'landscape' ? 'max-w-3xl p-4' : 'max-w-xl p-5'
                  }`} 
                  id="interactive-dialog-sheet"
                >
                  {/* Upper header with school portal details */}
                  <div className={`flex justify-between items-center border-b border-slate-450 pb-1.5 ${
                    printOrientation === 'landscape' ? 'mb-2.5' : 'mb-3.5'
                  }`}>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block">Academic Record</span>
                      <h1 className={`font-black uppercase tracking-tight text-slate-950 font-display ${
                        printOrientation === 'landscape' ? 'text-lg' : 'text-xl'
                      }`}>
                        Project Report
                      </h1>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block">Report UID</span>
                      <span className="font-mono text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {printableSubmission.id.substring(0, 12).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-row items-stretch justify-between border border-slate-350 rounded bg-slate-50 text-left text-[10px] w-full shrink-0 mb-3 font-sans overflow-hidden">
                    <div className="flex-1 p-2 border-r border-slate-200 min-w-0">
                      <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Student Name</span>
                      <span className="font-extrabold text-slate-900 text-[11px] block truncate">{printableSubmission.name}</span>
                    </div>
                    <div className="flex-1 p-2 border-r border-slate-200 min-w-0">
                      <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Project Title</span>
                      <span className="font-extrabold text-indigo-700 text-[11px] block truncate">{printableSubmission.projectName}</span>
                    </div>
                    <div className="p-2 border-r border-slate-200 shrink-0 w-24">
                      <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Class / Section</span>
                      <span className="font-bold text-slate-800 text-[11px] block">{printableSubmission.class}</span>
                    </div>
                    <div className="p-2 border-r border-slate-200 shrink-0 w-24">
                      <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Roll Number</span>
                      <span className="font-bold text-slate-800 text-[11px] block font-mono">Roll No #{printableSubmission.rollNo}</span>
                    </div>
                    <div className="p-2 shrink-0 w-44">
                      <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Submission Date</span>
                      <span className="font-medium text-slate-700 text-[9px] block">
                        {new Date(printableSubmission.createdAt).toLocaleDateString(undefined, {
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
                  <div className={printOrientation === 'landscape' ? 'mb-3' : 'mb-5'}>
                    <span className="text-[8px] uppercase font-extrabold tracking-widest text-slate-400 block mb-1">
                      Project Screenshot Proof (Main Content)
                    </span>
                    <div className={`w-full bg-slate-50 rounded-md overflow-hidden border border-slate-200 flex items-center justify-center p-1.5 transition-all ${
                      printOrientation === 'landscape' ? 'min-h-[350px] max-h-[500px]' : 'min-h-[500px] max-h-[720px]'
                    }`}>
                      <img
                        src={printableSubmission.screenshot}
                        alt="Preview submit"
                        className={`max-w-full object-contain rounded transition-all ${
                          printOrientation === 'landscape' ? 'max-h-[490px]' : 'max-h-[710px]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Teacher Grading & Official Signature block */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-350 pt-3 mt-auto">
                    {/* Grade Block on the left */}
                    <div className="flex flex-col justify-end">
                      <div className="inline-block bg-slate-50 border border-slate-300 rounded px-3 py-2 w-44 text-xs font-sans">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Assigned Grade</span>
                        <span className="text-xs font-black text-indigo-700">
                          {printableSubmission.grade ? `Grade: ${printableSubmission.grade}` : 'Grade: _____________'}
                        </span>
                      </div>
                    </div>

                    {/* Classroom Teacher Signature on the right */}
                    <div className="flex flex-col justify-end text-right pl-6">
                      <div className="space-y-2">
                        <div className="pt-4">
                          <div className="border-b border-slate-400 w-36 ml-auto my-1" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 block">
                            Classroom Teacher Signature
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons bar */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div />

                <div className="flex gap-2.5 self-end sm:self-auto flex-wrap">
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="px-3.5 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => {
                      if (printableSubmission) {
                        handleTriggerBrowserPrint(printableSubmission, printOrientation);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-indigo-100 cursor-pointer transition-all animate-pulse"
                  >
                    <Printer className="w-4 h-4" />
                    Print / Save PDF ({printOrientation === 'landscape' ? 'Landscape' : 'Portrait'})
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

