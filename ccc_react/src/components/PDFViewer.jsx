import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

const PDFViewer = ({
  file,
  currentPage,
  numPages,
  scale,
  onLoadSuccess,
  onLoadError,
  boxes = [],
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onPageChange,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [pageObj, setPageObj] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (pageObj) {
      const viewport = pageObj.getViewport({ scale: 1.0 });
      setDimensions({
        width: viewport.width,
        height: viewport.height,
      });
    }
  }, [pageObj]);

  const handleLoadSuccess = (pdf) => {
    setIsLoading(false);
    onLoadSuccess(pdf);
  };

  const handleLoadError = (error) => {
    setIsLoading(false);
    onLoadError(error);
  };

  const handlePageLoadSuccess = (page) => {
    setPageObj(page);
    const viewport = page.getViewport({ scale: 1.0 });
    setDimensions({
      width: viewport.width,
      height: viewport.height,
    });
  };

  const handleMouseDown = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onMouseDown({ x, y }, e.altKey);
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onMouseMove({ x, y });
  };

  const handleMouseUp = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onMouseUp({ x, y });
  };

  return (
    <div className="flex flex-col items-center">
      <div
        ref={containerRef}
        className="relative inline-block border border-gray-100 mt-6 select-none shadow-xl rounded-sm"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          cursor: "crosshair",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
            <div className="text-gray-600">Loading PDF...</div>
          </div>
        )}
        <Document
          file={file}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}>
          <Page
            pageNumber={currentPage}
            scale={scale}
            onLoadSuccess={handlePageLoadSuccess}
          />
          {boxes.map((box, index) => (
            <div
              key={index}
              className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-20"
              style={{
                left: box.x,
                top: box.y,
                width: box.width,
                height: box.height,
              }}
            />
          ))}
        </Document>
      </div>
      <div className="flex items-center space-x-4 mt-4">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
          Previous Page
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {numPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
          disabled={currentPage >= numPages}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
          Next Page
        </button>
      </div>
    </div>
  );
};

export default PDFViewer;
