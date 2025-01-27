import React, { forwardRef } from "react";
import { Stage, Layer, Rect } from "react-konva";

const DrawingCanvas = forwardRef(
  (
    { width, height, boxes, isDrawing, onMouseDown, onMouseMove, onMouseUp },
    ref
  ) => {
    return (
      <Stage
        width={width}
        height={height}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        ref={ref}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "all" }}>
        <Layer>
          {boxes.map((box, i) => (
            <Rect
              key={i}
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              stroke="red"
              strokeWidth={2}
              fill="rgba(255, 0, 0, 0.1)"
            />
          ))}
        </Layer>
      </Stage>
    );
  }
);

export default DrawingCanvas;
