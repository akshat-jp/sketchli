// App.tsx
import { useEffect, useRef, useState } from 'react'
import { DrawInit } from "./components/draw"
import DrawingToolbarLight from "./components/navbar"
import type { ToolId } from "./components/navbar"
import './App.css'

const NAVBAR_HEIGHT = 72; // px — height of the toolbar bar area

function App() {
  
  const [selectedTool, setSelectedTool] = useState<ToolId>("selector");
  
  const canvaRef = useRef<HTMLCanvasElement>(null);
  const selectedToolRef = useRef(selectedTool); 

  useEffect(() => {
    if (canvaRef.current) {
      DrawInit(canvaRef.current, selectedToolRef);
    }
  }, [canvaRef]);

  useEffect(() => {
    
      selectedToolRef.current = selectedTool;
      
  }, [selectedTool]);

  // Whenever selectedTool changes, tell your draw module
  useEffect(() => {
    console.log("Active tool:", selectedTool); // replace with DrawSetTool(selectedTool) etc.
  }, [selectedTool]);

  return (
    <div style={{ height: "100vh", overflow: "hidden", position: "relative" }}>
      {/* Fixed navbar floats above canvas, centered */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: NAVBAR_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}>
        <div>
          <DrawingToolbarLight
          activeTool={selectedTool}
          onToolChange={setSelectedTool}   //  wires the click up to App state
        />
        </div>
      </div>

      {/* Canvas starts below the navbar */}
      <canvas
        ref={canvaRef}
        width={window.innerWidth}
        height={window.innerHeight - NAVBAR_HEIGHT}
        style={{ position: "absolute", top: NAVBAR_HEIGHT, left: 0 }}
      />
    </div>
  );
}

export default App;