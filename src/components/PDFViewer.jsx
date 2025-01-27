import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PDFViewer = ({
  file,
  currentPage,
  scale,
  onLoadSuccess,
  onLoadError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const handleLoadSuccess = (pdf) => {
    setIsLoading(false);
    onLoadSuccess(pdf);
  };

  const handleLoadError = (error) => {
    setIsLoading(false);
    onLoadError(error);
  };

  const handlePageLoadSuccess = (page) => {
    const viewport = page.getViewport({ scale: 1.0 });
    setDimensions({
      width: viewport.width * scale,
      height: viewport.height * scale,
    });
  };

  return (
    <div
      className="relative inline-block border border-gray-300 mt-6"
      style={{ width: dimensions.width, height: dimensions.height }}>
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
          scale={scale}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          loading={null}
          onLoadSuccess={handlePageLoadSuccess}
        />
      </Document>
    </div>
  );
};

export default PDFViewer;
