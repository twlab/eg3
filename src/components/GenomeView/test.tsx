import React, { useState, useRef, useEffect } from "react";

function CanvasSwitcher() {
  const [activeArray, setActiveArray] = useState("first"); // 'first' or 'second'
  const firstCanvasRefs = useRef([]);
  const secondCanvasRefs = useRef([]);
  const windowWidth = window.innerWidth; // Example window width, adjust as necessary

  // Initialize refs for both canvas arrays
  useEffect(() => {
    firstCanvasRefs.current = firstCanvasData.map(
      (_, i) => firstCanvasRefs.current[i] || React.createRef()
    );
    secondCanvasRefs.current = secondCanvasData.map(
      (_, i) => secondCanvasRefs.current[i] || React.createRef()
    );
  }, []);

  // Function to clear a specific canvas
  const clearCanvas = (canvasRef) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Function to draw on the first canvas array
  const drawOnFirstCanvasArray = () => {
    firstCanvasRefs.current.forEach((ref) => {
      clearCanvas(ref);
      // ... drawing logic for the first canvas array ...
    });
  };

  // Function to draw on the second canvas array
  const drawOnSecondCanvasArray = () => {
    secondCanvasRefs.current.forEach((ref) => {
      clearCanvas(ref);
      // ... drawing logic for the second canvas array ...
    });
  };

  // Function to switch between canvas arrays
  const switchCanvasArray = () => {
    // Clear all canvases before switching
    firstCanvasRefs.current.forEach(clearCanvas);
    secondCanvasRefs.current.forEach(clearCanvas);

    // Switch the active array and redraw
    if (activeArray === "first") {
      setActiveArray("second");
      drawOnSecondCanvasArray();
    } else {
      setActiveArray("first");
      drawOnFirstCanvasArray();
    }
  };

  return (
    <div>
      {activeArray === "first"
        ? firstCanvasData.map((data, index) => (
            <canvas
              key={`first-${index}`}
              ref={firstCanvasRefs.current[index]}
              width={windowWidth}
              height={200}
            />
          ))
        : secondCanvasData.map((data, index) => (
            <canvas
              key={`second-${index}`}
              ref={secondCanvasRefs.current[index]}
              width={windowWidth}
              height={200}
            />
          ))}
      <button onClick={switchCanvasArray}>Switch Canvas Array</button>
    </div>
  );
}
