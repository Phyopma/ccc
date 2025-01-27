import React from "react";

const PDFUploader = ({ onFileChange, error }) => {
  return (
    <div className="mb-6 text-center">
      <label className="block mb-2">
        <span className="text-gray-900 text-lg font-semibold">Upload PDF</span>
        <input
          type="file"
          accept=".pdf"
          onChange={onFileChange}
          className="mt-4 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm
                   hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
                   file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                   file:text-sm file:font-semibold file:bg-blue-500 file:text-white
                   hover:file:bg-blue-600 cursor-pointer text-gray-900"
        />
      </label>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
};

export default PDFUploader;
