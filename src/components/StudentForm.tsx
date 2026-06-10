/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, BookOpen, Hash, Presentation } from 'lucide-react';

interface StudentFormProps {
  name: string;
  setName: (v: string) => void;
  projectName: string;
  setProjectName: (v: string) => void;
  classVal: string;
  setClassVal: (v: string) => void;
  rollNo: string;
  setRollNo: (v: string) => void;
  errors: { [key: string]: string };
}

export default function StudentForm({
  name,
  setName,
  projectName,
  setProjectName,
  classVal,
  setClassVal,
  rollNo,
  setRollNo,
  errors
}: StudentFormProps) {
  return (
    <div id="student-form-fields" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Student Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5" htmlFor="student-name-input">
          <User className="w-3.5 h-3.5 text-indigo-500" />
          Full Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <User className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            id="student-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John Doe"
            className={`block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all placeholder:text-gray-400 font-medium ${
              errors.name ? 'border-red-300 bg-red-50/10' : 'border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          />
        </div>
        {errors.name && (
          <p className="text-xs font-medium text-red-600 mt-1" id="name-error-msg">{errors.name}</p>
        )}
      </div>

      {/* Project Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5" htmlFor="project-name-input">
          <Presentation className="w-3.5 h-3.5 text-indigo-500" />
          Project Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Presentation className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            id="project-name-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Solar System"
            className={`block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all placeholder:text-gray-400 font-medium ${
              errors.projectName ? 'border-red-300 bg-red-50/10' : 'border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          />
        </div>
        {errors.projectName && (
          <p className="text-xs font-medium text-red-600 mt-1" id="project-error-msg">{errors.projectName}</p>
        )}
      </div>

      {/* Class/Section */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5" htmlFor="class-input">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          Class / Section
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <BookOpen className="h-4 w-4 text-gray-400" />
          </div>
          <select
            id="class-input"
            value={classVal}
            onChange={(e) => setClassVal(e.target.value)}
            className={`block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all font-medium appearance-none cursor-pointer ${
              errors.classVal ? 'border-red-300 bg-red-50/10 text-red-900' : 'border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          >
            <option value="">-- Choose Class --</option>
            <option value="3A">Class 3A</option>
            <option value="3B">Class 3B</option>
            <option value="4A">Class 4A</option>
            <option value="4B">Class 4B</option>
            <option value="5A">Class 5A</option>
            <option value="5B">Class 5B</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        {errors.classVal && (
          <p className="text-xs font-medium text-red-600 mt-1" id="class-error-msg">{errors.classVal}</p>
        )}
      </div>

      {/* Roll Number */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5" htmlFor="rollno-input">
          <Hash className="w-3.5 h-3.5 text-indigo-500" />
          Roll Number
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Hash className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            id="rollno-input"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            placeholder="e.g. 24"
            className={`block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all placeholder:text-gray-400 font-medium ${
              errors.rollNo ? 'border-red-300 bg-red-50/10' : 'border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          />
        </div>
        {errors.rollNo && (
          <p className="text-xs font-medium text-red-600 mt-1" id="rollno-error-msg">{errors.rollNo}</p>
        )}
      </div>
    </div>
  );
}
