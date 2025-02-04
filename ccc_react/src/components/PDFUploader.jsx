import React from "react";
import { useTheme } from "../context/ThemeContext";

const PDFUploader = ({ onFileChange, error, selectedFiles }) => {
  const { darkMode } = useTheme();

  return (
    <div className="space-y-4">
      <div
        className={`mb-6 text-center p-8 ${
          darkMode ? "bg-gray-700" : "bg-gray-50"
        } rounded-lg border-2 border-dashed ${
          darkMode
            ? "border-gray-500 hover:border-blue-400"
            : "border-gray-300 hover:border-blue-500"
        } transition-colors duration-200`}>
        <label className="block cursor-pointer">
          <div className="mb-4">
            <svg
              className={`mx-auto h-12 w-12 ${
                darkMode ? "text-gray-400" : "text-gray-400"
              }`}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true">
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className={`flex text-sm ${
                darkMode ? "text-gray-300" : "text-gray-600"
              } justify-center`}>
              <span
                className={`relative ${
                  darkMode ? "bg-gray-700" : "bg-white"
                } rounded-md font-medium ${
                  darkMode
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-500"
                } focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500`}>
                <span>Upload PDF files</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={onFileChange}
                  className="sr-only"
                  multiple
                />
              </span>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p
              className={`text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              } mt-2`}>
              Multiple PDF files up to 10MB each
            </p>
          </div>
        </label>
      </div>

      {selectedFiles && selectedFiles.length > 0 && (
        <div
          className={`${
            darkMode ? "bg-gray-800" : "bg-white"
          } rounded-lg shadow p-4`}>
          <h3
            className={`text-sm font-medium ${
              darkMode ? "text-gray-200" : "text-gray-900"
            } mb-3`}>
            Selected Files:
          </h3>
          <ul className="space-y-2">
            {selectedFiles.map((file, index) => (
              <li
                key={index}
                className={`flex items-center justify-between py-2 px-3 ${
                  darkMode ? "bg-gray-700" : "bg-gray-50"
                } rounded-md`}>
                <span
                  className={`text-sm ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  } truncate`}>
                  {file.name}
                </span>
                <span
                  className={`text-xs ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div
          className={`mt-2 text-sm text-red-600 ${
            darkMode ? "bg-red-900" : "bg-red-50"
          } p-2 rounded-md flex items-center justify-center`}>
          <svg
            className="h-5 w-5 text-red-500 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default PDFUploader;
