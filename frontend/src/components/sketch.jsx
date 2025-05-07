"use client";
import { Button } from "@/components/ui/button";
import {
  EraserIcon,
  PaintBucket,
  Pencil,
  Redo,
  RotateCcw,
  Undo,
} from "lucide-react";
import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

const DrawingCanvas = forwardRef(
  (
    { width = "600px", height = "500px", readOnly = false, onDrawingChange },
    ref
  ) => {
    const canvasRef = useRef(null);

    const eraserCursor = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'><path fill='gray' d='M16.24 2.56c-.3 0-.59.11-.82.34L7.22 11.1a1.15 1.15 0 0 0 0 1.64l4.24 4.24a1.15 1.15 0 0 0 1.64 0l8.2-8.2a1.15 1.15 0 0 0 0-1.64l-4.24-4.24a1.15 1.15 0 0 0-.82-.34zm-6.9 8.1l4.24-4.24l3.54 3.54l-4.24 4.24l-3.54-3.54zm-5.3 6.02L5.88 15.2l2.83-2.83l3.54 3.54l-2.83 2.83H4.04zm8.5 1.42l-1.41-1.41l1.42-1.42l1.41 1.41l-1.42 1.42z'/></svg>") 0 32, auto`;

    const pencilCursor = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'><path fill='black' d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75z'/><path fill='black' d='M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83l3.75 3.75l1.84-1.82z'/></svg>") 0 32, auto`;

    const styles = {
      border: "0.0625rem solid #9c9c9c",
      borderRadius: "0.25rem",
      cursor: pencilCursor,
    };

    const eraserStyles = {
      ...styles,
      cursor: eraserCursor,
    };

    const [strokeColor, setStrokeColor] = useState("#000000");
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [isEraser, setIsEraser] = useState(false);
    const [isPencil, setIsPencil] = useState(true);
    const [paint, setPaint] = useState("#ffffff");

    useImperativeHandle(ref, () => ({
      getDataUrl: async () => {
        if (canvasRef.current) {
          return await canvasRef.current.exportImage("png");
        }
        return "";
      },
      clearCanvas: () => {
        if (canvasRef.current) {
          canvasRef.current.clearCanvas();
        }
      },
    }));

    const handleEraser = () => {
      setIsEraser(true);
      setIsPencil(false);
      canvasRef.current?.eraseMode(true);
    };

    const handlePencil = () => {
      setIsPencil(true);
      setIsEraser(false);
      canvasRef.current?.eraseMode(false);
    };

    const handleundo = () => canvasRef.current?.undo();
    const handleredo = () => canvasRef.current?.redo();
    const handleclear = () => canvasRef.current?.clearCanvas();

    const handleOnChange = async () => {
      if (onDrawingChange && canvasRef.current) {
        const dataUrl = await canvasRef.current.exportImage("png");
        onDrawingChange(dataUrl);
      }
    };

    return (
      <div className="w-full max-w-7xl h-[700px] flex flex-col justify-start items-center">
        {!readOnly && (
          <div className="flex flex-wrap gap-3 mb-4 justify-center">
            <div className="flex gap-2">
              <Button size="icon" style={{ backgroundColor: strokeColor }}>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  style={{
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                    opacity: 0,
                  }}
                  aria-label="Stroke color"
                />
              </Button>
              <Pencil size="30" />
            </div>

            <div className="flex gap-2">
              <Button
                size="icon"
                style={{
                  backgroundColor: paint,
                  border: "0.0625rem solid #9c9c9c",
                }}
              >
                <input
                  type="color"
                  value={paint}
                  onChange={(e) => setPaint(e.target.value)}
                  style={{
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                    opacity: 0,
                  }}
                  aria-label="Canvas color"
                />
              </Button>
              <PaintBucket size="30" />
            </div>

            <input
              type="number"
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              placeholder="Stroke width"
              value={strokeWidth}
              min="1"
              max="50"
              className="p-2 text-black border rounded w-14"
              aria-label="Stroke width"
            />

            <Button
              className="text-black"
              size="icon"
              type="button"
              disabled={isEraser}
              onClick={handleEraser}
              variant={isEraser ? "secondary" : "outline"}
              aria-label="Eraser tool"
            >
              <EraserIcon />
            </Button>

            <Button
              size="icon"
              type="button"
              disabled={isPencil}
              onClick={handlePencil}
              variant={isPencil ? "secondary" : "outline"}
              aria-label="Pencil tool"
            >
              <Pencil />
            </Button>

            <div className="flex gap-2">
              <Button
                className="text-black"
                onClick={handleundo}
                size="icon"
                type="button"
                variant="outline"
                aria-label="Undo"
              >
                <Undo />
              </Button>
              <Button
                className="text-black"
                onClick={handleredo}
                size="icon"
                type="button"
                variant="outline"
                aria-label="Redo"
              >
                <Redo />
              </Button>
            </div>

            <Button
              className="text-black"
              onClick={handleclear}
              size="icon"
              type="button"
              variant="outline"
              aria-label="Clear canvas"
            >
              <RotateCcw />
            </Button>
          </div>
        )}

        <ReactSketchCanvas
          ref={canvasRef}
          style={isEraser ? eraserStyles : styles}
          width="100%"
          height="100%"
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          canvasColor={paint}
          eraserWidth={strokeWidth}
          className="border rounded-lg flex-grow"
          onChange={handleOnChange}
          readOnly={readOnly}
        />
      </div>
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";

export default DrawingCanvas;
