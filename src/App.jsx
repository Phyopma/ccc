import { useState, useRef } from "react";
import PDFUploader from "./components/PDFUploader";
import PDFViewer from "./components/PDFViewer";
import DrawingCanvas from "./components/DrawingCanvas";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
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

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    setIsDrawing(true);
    setStartPos(pos);

    // Initialize boxes array for current page if it doesn't exist
    if (!boxesByPage[currentPage]) {
      setBoxesByPage((prev) => ({ ...prev, [currentPage]: [] }));
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const pos = e.target.getStage().getPointerPosition();
    const newBox = {
      x: Math.min(pos.x, startPos.x),
      y: Math.min(pos.y, startPos.y),
      width: Math.abs(pos.x - startPos.x),
      height: Math.abs(pos.y - startPos.y),
    };

    const currentBoxes = boxesByPage[currentPage] || [];
    setBoxesByPage({
      ...boxesByPage,
      [currentPage]: [...currentBoxes.slice(0, -1), newBox],
    });
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      const pos = stageRef.current.getPointerPosition();
      const newBox = {
        x: Math.min(pos.x, startPos.x),
        y: Math.min(pos.y, startPos.y),
        width: Math.abs(pos.x - startPos.x),
        height: Math.abs(pos.y - startPos.y),
      };

      const currentBoxes = boxesByPage[currentPage] || [];
      setBoxesByPage({
        ...boxesByPage,
        [currentPage]: [...currentBoxes, newBox],
      });
    }
    setIsDrawing(false);
  };

  return (
    <div className="max-w-5xl mx-auto h-full w-full bg-slate-400 p-8">
      <PDFUploader onFileChange={onFileChange} error={error} />

      {pdfFile && (
        <div className="space-y-4">
          <div className="space-x-4">
            <button
              onClick={() => setScale(scale + 0.1)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors">
              Zoom In
            </button>
            <button
              onClick={() => setScale(scale - 0.1)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors">
              Zoom Out
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors">
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(numPages, currentPage + 1))
              }
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors">
              Next
            </button>
          </div>

          <div className="relative">
            <PDFViewer
              file={pdfFile}
              currentPage={currentPage}
              numPages={numPages}
              scale={scale}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
            />
            <DrawingCanvas
              width={stageDimensions.width}
              height={stageDimensions.height}
              boxes={boxesByPage[currentPage] || []}
              isDrawing={isDrawing}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              ref={stageRef}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
