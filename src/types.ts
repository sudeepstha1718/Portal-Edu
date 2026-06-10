/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Submission {
  id: string;
  name: string;
  projectName: string;
  class: string;
  rollNo: string;
  screenshot: string; // base64 string
  createdAt: number; // UTC timestamp milliseconds
  projectFileName?: string;
  projectFileContent?: string; // base64 string
  grade?: string; // teacher's grade
}
