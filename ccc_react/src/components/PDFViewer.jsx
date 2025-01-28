import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

const PDFViewer = ({
  file,
  currentPage,
  scale,
  onLoadSuccess,
  onLoadError,
  boxes = [],
  onMouseDown,
  onMouseMove,
  onMouseUp,
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
        onLoadError={handleLoadError}
        loading={null}>
        <Page
          pageNumber={currentPage}
          scale={1.0}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          loading={null}
          onLoadSuccess={handlePageLoadSuccess}
        />
      </Document>
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        style={{ width: "100%", height: "100%" }}>
        {boxes.map((box, i) => (
          <rect
            key={i}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            stroke="red"
            strokeWidth="2"
            fill="rgba(255, 0, 0, 0.1)"
          />
        ))}
      </svg>
    </div>
  );
};

export default PDFViewer;
