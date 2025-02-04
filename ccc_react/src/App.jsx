import { useState, useRef, useEffect } from "react";
import PDFUploader from "./components/PDFUploader";
import PDFViewer from "./components/PDFViewer";

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewBox, setPreviewBox] = useState(null);
  const [scale] = useState(1.0);
  const [boxesByFile, setBoxesByFile] = useState({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState("");
  const stageRef = useRef(null);
  const [stageDimensions, setStageDimensions] = useState({
    width: 800,
    height: 1000,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedFiles.length > 0) {
      setPdfFile(URL.createObjectURL(selectedFiles[currentFileIndex]));
      setCurrentPage(1);
    }
  }, [currentFileIndex, selectedFiles]);

  const onFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      setCurrentFileIndex(0);
      setError(null);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleMouseDown = (e, altKey) => {
    if (altKey) {
      setIsDrawing(true);
      setStartPos(e);

      if (!boxesByFile[currentFileIndex]) {
        setBoxesByFile((prev) => ({ ...prev, [currentFileIndex]: {} }));
      }
      if (!boxesByFile[currentFileIndex][currentPage]) {
        setBoxesByFile((prev) => ({
          ...prev,
          [currentFileIndex]: {
            ...prev[currentFileIndex],
            [currentPage]: [],
          },
        }));
      }
    } else {
      const currentBoxes = boxesByFile[currentFileIndex]?.[currentPage] || [];
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
        setBoxesByFile((prev) => ({
          ...prev,
          [currentFileIndex]: {
            ...prev[currentFileIndex],
            [currentPage]: updatedBoxes,
          },
        }));
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

    setPreviewBox(newBox);
  };

  const handleMouseUp = (e) => {
    if (isDrawing) {
      const newBox = {
        x: Math.min(e.x, startPos.x),
        y: Math.min(e.y, startPos.y),
        width: Math.abs(e.x - startPos.x),
        height: Math.abs(e.y - startPos.y),
      };

      const currentBoxes = boxesByFile[currentFileIndex]?.[currentPage] || [];
      setBoxesByFile((prev) => ({
        ...prev,
        [currentFileIndex]: {
          ...prev[currentFileIndex],
          [currentPage]: [...currentBoxes, newBox],
        },
      }));
    }
    setPreviewBox(null);
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

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      setError("Please upload PDF files first");
      return;
    }

    setIsSubmitting(true);
    setSubmitProgress("Preparing files for submission...");
    setError(null);

    try {
      const formData = new FormData();

      // Append all files with unique keys
      selectedFiles.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });

      // Append all boxes data as a single JSON string
      formData.append("boxes", JSON.stringify(boxesByFile));

      setSubmitProgress("Uploading files and processing...");
      const submitResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/submit`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await submitResponse.json();

      if (!submitResponse.ok) {
        throw new Error(data.error || "Failed to submit PDF and boxes");
      }

      setSubmitProgress("Processing completed successfully!");
      console.log("Submission successful:", data);
    } catch (err) {
      console.error("Error submitting PDFs:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            PDF Annotation Tool
          </h1>
          <PDFUploader
            onFileChange={onFileChange}
            error={error}
            selectedFiles={selectedFiles}
          />
          {isSubmitting && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <div className="flex items-center">
                <div className="mr-3">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <span className="text-blue-700">{submitProgress}</span>
              </div>
            </div>
          )}
        </div>

        {pdfFile && (
          <>
            <div className="p-6 space-y-6">
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

              <div className="relative rounded-lg flex justify-center p-4">
                <PDFViewer
                  file={pdfFile}
                  currentPage={currentPage}
                  numPages={numPages}
                  scale={scale}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  boxes={[
                    ...(boxesByFile[currentFileIndex]?.[currentPage] || []),
                    ...(previewBox ? [previewBox] : []),
                  ]}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex space-x-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    "Submit All Files"
                  )}
                </button>
                <button
                  onClick={() =>
                    setCurrentFileIndex(Math.max(0, currentFileIndex - 1))
                  }
                  disabled={currentFileIndex <= 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                  Previous File
                </button>
                <button
                  onClick={() =>
                    setCurrentFileIndex(
                      Math.min(selectedFiles.length - 1, currentFileIndex + 1)
                    )
                  }
                  disabled={currentFileIndex >= selectedFiles.length - 1}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                  Next File
                </button>
              </div>
              <div className="text-sm text-gray-600">
                File {currentFileIndex + 1} of {selectedFiles.length} | Page{" "}
                {currentPage} of {numPages || "-"}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
