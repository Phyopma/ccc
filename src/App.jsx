import { useState, useRef } from "react";
import PDFUploader from "./components/PDFUploader";
import PDFViewer from "./components/PDFViewer";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale] = useState(1.0);
  const [boxesByPage, setBoxesByPage] = useState({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);
  const [stageDimensions, setStageDimensions] = useState({
    width: 800,
    height: 1000,
  });
  const [error, setError] = useState(null);

  const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPdfFile(URL.createObjectURL(file));
      setError(null);
      setBoxesByPage({});
    }
  };

  const handleMouseDown = (e, altKey) => {
    if (altKey) {
      setIsDrawing(true);
      setStartPos(e);

      if (!boxesByPage[currentPage]) {
        setBoxesByPage((prev) => ({ ...prev, [currentPage]: [] }));
      }
    } else {
      // Check if clicked on a box to delete it
      const currentBoxes = boxesByPage[currentPage] || [];
      const clickedBoxIndex = currentBoxes.findIndex(
        (box) =>
          e.x >= box.x &&
          e.x <= box.x + box.width &&
          e.y >= box.y &&
          e.y <= box.y + box.height
      );

      if (clickedBoxIndex !== -1) {
        const updatedBoxes = [...currentBoxes];
        updatedBoxes.splice(clickedBoxIndex, 1);
        setBoxesByPage({
          ...boxesByPage,
          [currentPage]: updatedBoxes,
        });
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const newBox = {
      x: Math.min(e.x, startPos.x),
      y: Math.min(e.y, startPos.y),
      width: Math.abs(e.x - startPos.x),
      height: Math.abs(e.y - startPos.y),
    };

    const currentBoxes = boxesByPage[currentPage] || [];
    setBoxesByPage({
      ...boxesByPage,
      [currentPage]: [...currentBoxes.slice(0, -1), newBox],
    });
  };

  const handleMouseUp = (e) => {
    if (isDrawing) {
      const newBox = {
        x: Math.min(e.x, startPos.x),
        y: Math.min(e.y, startPos.y),
        width: Math.abs(e.x - startPos.x),
        height: Math.abs(e.y - startPos.y),
      };

      const currentBoxes = boxesByPage[currentPage] || [];
      setBoxesByPage({
        ...boxesByPage,
        [currentPage]: [...currentBoxes, newBox],
      });
    }
    setIsDrawing(false);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError(null);
    const pdfContainer = document.querySelector(".react-pdf__Page");
    if (pdfContainer) {
      setStageDimensions({
        width: pdfContainer.clientWidth,
        height: pdfContainer.clientHeight,
      });
    }
  };

  const onDocumentLoadError = (error) => {
    console.error("Error loading PDF:", error);
    setError(
      "Failed to load PDF. Please make sure the file is a valid PDF document."
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            PDF Annotation Tool
          </h1>
          <PDFUploader onFileChange={onFileChange} error={error} />
        </div>

        {pdfFile && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(numPages, currentPage + 1))
                  }
                  disabled={currentPage >= numPages}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                  Next
                  <svg
                    className="h-5 w-5 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {numPages || "-"}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h2 className="text-sm font-medium text-gray-700 mb-2">
                Instructions:
              </h2>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Hold Alt + Click and drag to draw a box</li>
                <li>• Click on any box to delete it</li>
                <li>• Use the navigation buttons to move between pages</li>
              </ul>
            </div>

            <div className="relative bg-white rounded-lg shadow-inner p-4">
              <PDFViewer
                file={pdfFile}
                currentPage={currentPage}
                numPages={numPages}
                scale={scale}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                boxes={boxesByPage[currentPage] || []}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
