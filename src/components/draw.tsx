import { drawArrow } from "./arrow";
import { drawPen } from "./pen";

// draw.tsx
type Shape =
  | { type: "rect"; x: number; y: number; width: number; height: number }
  | { type: "circle"; centerX: number; centerY: number; radius: number }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number }
  | {type : "arrow"; x1: number; y1:number; x2:number; y2:number}
  | {type : "pencil"; points:{x: number; y: number}[] }
  | {type : "text"; x: number; y: number, content: string}
  | {type : "eraser"}
  | {type : "selector"}

export function DrawInit(canvas: HTMLCanvasElement, selectedTool : React.MutableRefObject<string>) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const existingShapes: Shape[] = [];
  let currentPath: {x : number; y: number} [] = [];
  let clicked = false;
  let startX = 0;
  let startY = 0;
  let activeInput: HTMLTextAreaElement | null = null;
  let activeInputPos: { x: number; y: number } | null = null;
  let selectedShapeIndex: number | null = null;
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // when mouse clicked
  canvas.addEventListener("mousedown", (e) => {
    clicked = true;
    startX = e.offsetX;
    startY = e.offsetY;

    if(selectedTool.current === "pencil"){
      currentPath = [{x : startX , y: startY}];
    }
    else if(selectedTool.current === "text"){
        // Prevent other tools from treating this as a draw gesture
        clicked = false;

        // If there's already an active textarea, commit it first
        if (activeInput) {
          commitInput(activeInput, activeInputPos!, existingShapes, canvas, ctx);
          activeInput = null;
          activeInputPos = null;
          return;
        }

        const textarea = document.createElement("textarea");
        const canvasRect = canvas.getBoundingClientRect();

        textarea.style.position = "fixed";
        textarea.style.left = `${canvasRect.left + e.offsetX}px`;
        textarea.style.top = `${canvasRect.top + e.offsetY - 20}px`;
        textarea.style.fontSize = "20px";
        textarea.style.fontFamily = "sans-serif";
        textarea.style.lineHeight = "1.3";
        textarea.style.border = "1.5px dashed #6366f1";
        textarea.style.outline = "none";
        textarea.style.background = "rgba(255,255,255,0.88)";
        textarea.style.padding = "2px 4px";
        textarea.style.borderRadius = "4px";
        textarea.style.resize = "none";
        textarea.style.overflow = "hidden";
        textarea.style.minWidth = "80px";
        textarea.style.zIndex = "50";
        textarea.style.color = "#000";
        textarea.rows = 1;

        textarea.addEventListener("input", () => {
          textarea.style.height = "auto";
          textarea.style.height = textarea.scrollHeight + "px";
          // Also grow width based on content
          const lines = textarea.value.split("\n");
          const longest = Math.max(...lines.map(l => l.length));
          textarea.style.width = Math.max(80, longest * 12) + "px";
        });

        textarea.addEventListener("keydown", (ke) => {
          // Escape = cancel without saving
          if (ke.key === "Escape") {
            ke.stopPropagation();
            if (textarea.parentNode) document.body.removeChild(textarea);
            activeInput = null;
            activeInputPos = null;
          }
        });

        // Use mousedown on document (not blur) to detect "click away"
        const handleOutsideClick = (ev: MouseEvent) => {
          if (ev.target !== textarea) {
            document.removeEventListener("mousedown", handleOutsideClick);
            if (activeInput === textarea) {
              commitInput(textarea, activeInputPos!, existingShapes, canvas, ctx);
              activeInput = null;
              activeInputPos = null;
            }
          }
        };

        // Delay adding the listener so this very mousedown doesn't trigger it
        setTimeout(() => {
          document.addEventListener("mousedown", handleOutsideClick);
        }, 0);

        document.body.appendChild(textarea);
        textarea.focus();

        activeInput = textarea;
        activeInputPos = { x: e.offsetX, y: e.offsetY };
      } 
    else if(selectedTool.current === "eraser"){
      ClearCanvas(existingShapes, canvas, ctx, selectedShapeIndex);
      ctx.beginPath();
      ctx.arc(e.offsetX, e.offsetY, 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(150,150,150,0.8)";
      ctx.lineWidth = 1;
      ctx.stroke();

        // Erase any shape under cursor
      const hit = existingShapes.findIndex(s => hitTestShape(s, e.offsetX, e.offsetY));
      if (hit !== -1) {
        existingShapes.splice(hit, 1);
        ClearCanvas(existingShapes, canvas, ctx, selectedShapeIndex);
      }

    }
    else if(selectedTool.current === "selector"){
      // clicked = false;

      // Find topmost shape under cursor (search in reverse so top-drawn = top-picked)
        const hit = [...existingShapes].map((s, i) => ({ s, i }))
          .reverse()
          .find(({ s }) => hitTestShape(s, startX, startY));

        if (hit) {
          selectedShapeIndex = hit.i;
          isDragging = true;
          dragOffsetX = startX;
          dragOffsetY = startY;
        } else {
          selectedShapeIndex = null;
        }
        ClearCanvas(existingShapes, canvas, ctx, selectedShapeIndex);
    }
});

  // when mouse released
  canvas.addEventListener("mouseup", (e) => {
    clicked = false;
    const width = e.offsetX - startX;
    const height = e.offsetY - startY;

    if (selectedTool.current === "selector") {
      isDragging = false;
    }
     
    if(selectedTool.current === "rect"){
      existingShapes.push({
        type: "rect",
        x: startX,
        y: startY,
        height, width });
    } 
    else if(selectedTool.current === "circle"){
      const radius = Math.sqrt(width * width + height * height) / 2;
      existingShapes.push({
        type : "circle",
        centerX : startX + width /2,
        centerY : startY + height/2,
        radius : radius
      })
    }
    else if(selectedTool.current === "line"){
      existingShapes.push({
        type : "line",
        x1 : startX,
        y1 : startY,
        x2 : e.offsetX,
        y2 : e.offsetY
      })
    }
    else if(selectedTool.current === "arrow"){
      existingShapes.push({
        type : "arrow",
        x1 : startX,
        y1 : startY,
        x2 : e.offsetX,
        y2 : e.offsetY
      })
    }
    else if(selectedTool.current === "pencil"){
      existingShapes.push({type: "pencil", points: currentPath});
      // currentPath = [];
    }
  });

  // when mouse moving
  canvas.addEventListener("mousemove", (e) => {
    
    //eraser
      if (selectedTool.current === "eraser") {
        ClearCanvas(existingShapes, canvas, ctx, selectedShapeIndex);
        ctx.beginPath();
        ctx.arc(e.offsetX, e.offsetY, 8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(150,150,150,0.8)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }


    if (clicked) {
      const width = e.offsetX - startX;
      const height = e.offsetY - startY;
      
      ClearCanvas(existingShapes, canvas, ctx, selectedShapeIndex);

      if(selectedTool.current === "rect"){
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.strokeRect(startX, startY, width, height);
      }
      else if(selectedTool.current === "circle"){
        const radius = Math.sqrt(width * width + height * height) / 2;
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.beginPath();
        ctx.arc(startX + width/2, startY + height/2, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      else if(selectedTool.current === "line"){
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
      }
      else if(selectedTool.current === "arrow"){
        ctx.strokeStyle = "rgba(0,0,0,1)";
        drawArrow(ctx,startX, startY, e.offsetX, e.offsetY);
      }
      else if(selectedTool.current === "pencil"){
        currentPath.push({x: e.offsetX, y: e.offsetY});
        ClearCanvas(existingShapes, canvas, ctx, selectedShapeIndex);
        drawPen(ctx,currentPath);
      }
      else if (selectedTool.current === "eraser") {
        // Draw eraser cursor circle
        ClearCanvas(existingShapes, canvas, ctx, selectedShapeIndex);
        ctx.beginPath();
        ctx.arc(e.offsetX, e.offsetY, 8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(150,150,150,0.8)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Erase any shape under cursor
        const hit = existingShapes.findIndex(s => hitTestShape(s, e.offsetX, e.offsetY));
        if (hit !== -1) {
          existingShapes.splice(hit, 1);
          ClearCanvas(existingShapes, canvas, ctx, selectedShapeIndex);
        }
      }
      else if (selectedTool.current === "selector" && isDragging && selectedShapeIndex !== null) {
        const dx = e.offsetX - dragOffsetX;
        const dy = e.offsetY - dragOffsetY;
        dragOffsetX = e.offsetX;
        dragOffsetY = e.offsetY;

        const shape = existingShapes[selectedShapeIndex];
        existingShapes[selectedShapeIndex] = moveShape(shape, dx, dy);
        ClearCanvas(existingShapes, canvas, ctx, selectedShapeIndex);
      }

    }
    
  });

  window.addEventListener("keydown", (e) => {
  if (document.activeElement?.tagName === "TEXTAREA" ||
      document.activeElement?.tagName === "INPUT") return;

  if (e.key === "Delete" || e.key === "Backspace") {
    if (selectedShapeIndex !== null) {
      existingShapes.splice(selectedShapeIndex, 1);
      selectedShapeIndex = null;
      isDragging = false;
      ClearCanvas(existingShapes, canvas, ctx, null);
    }
  }
});


//
//
function commitInput(
  textarea: HTMLTextAreaElement,
  pos: { x: number; y: number },
  existingShapes: Shape[],
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) {
  const content = textarea.value.trim();
  if (content) {
    existingShapes.push({ type: "text", x: pos.x, y: pos.y, content });
    ClearCanvas(existingShapes, canvas, ctx,selectedShapeIndex);
  }
  if (textarea.parentNode) document.body.removeChild(textarea);
}
}

function ClearCanvas(
  existingShapes: Shape[],
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  selectedIndex: number | null = null
) {

//Takes the bounds from getSelectionBounds and actually draws the dashed purple box + corner handles on the canvas.
  function drawSelectionBox(ctx: CanvasRenderingContext2D, shape: Shape) {
    const bounds = getSelectionBounds(shape);
    if (!bounds) return;
    ctx.save();
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
    // Draw corner handles
    const corners = [
      [bounds.x, bounds.y],
      [bounds.x + bounds.w, bounds.y],
      [bounds.x, bounds.y + bounds.h],
      [bounds.x + bounds.w, bounds.y + bounds.h],
    ];
    ctx.setLineDash([]);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 1.5;
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  existingShapes.forEach((shape, i) => {
    if (shape.type === "rect") {
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
    else if(shape.type === "circle"){
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    else if(shape.type === "line"){
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
    }
    else if(shape.type === "arrow"){
      ctx.strokeStyle = "rgba(0,0,0,1)";
      drawArrow(ctx, shape.x1, shape.y1, shape.x2, shape.y2)
    }
    else if(shape.type === "pencil"){
      ctx.strokeStyle = "rgba(0,0,0,1)";
      drawPen(ctx, shape.points)
    }
    else if (shape.type === "text") {
      ctx.font = "20px sans-serif";
      ctx.fillStyle = "rgba(0,0,0,1)";
      const lines = shape.content.split("\n");
      lines.forEach((line, i) => {
        ctx.fillText(line, shape.x, shape.y + i * 20 * 1.3);
      });
    }
  // drawSelectionBox() will call with the selected shape ..
    if(i === selectedIndex){
      drawSelectionBox(ctx, shape);
    }

  });
}



//
function hitTestShape(shape: Shape, x: number, y: number, tolerance = 8): boolean {
  if (shape.type === "rect") {
    return x >= shape.x && x <= shape.x + shape.width &&
           y >= shape.y && y <= shape.y + shape.height;
  }
  if (shape.type === "circle") {
    const dx = x - shape.centerX, dy = y - shape.centerY;
    return Math.sqrt(dx * dx + dy * dy) <= shape.radius;
  }
  if (shape.type === "line") {
    // Distance from point to line segment
    const dx = shape.x2 - shape.x1, dy = shape.y2 - shape.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return false;
    const t = Math.max(0, Math.min(1, ((x - shape.x1) * dx + (y - shape.y1) * dy) / lenSq));
    const nearX = shape.x1 + t * dx, nearY = shape.y1 + t * dy;
    return Math.sqrt((x - nearX) ** 2 + (y - nearY) ** 2) <= tolerance;
  }
  if (shape.type === "arrow") {
    const dx = shape.x2 - shape.x1, dy = shape.y2 - shape.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return false;
    const t = Math.max(0, Math.min(1, ((x - shape.x1) * dx + (y - shape.y1) * dy) / lenSq));
    const nearX = shape.x1 + t * dx, nearY = shape.y1 + t * dy;
    return Math.sqrt((x - nearX) ** 2 + (y - nearY) ** 2) <= tolerance;
  }
  if (shape.type === "pencil") {
    for (let i = 0; i < shape.points.length - 1; i++) {
      const ax = shape.points[i].x, ay = shape.points[i].y;
      const bx = shape.points[i + 1].x, by = shape.points[i + 1].y;
      const dx = bx - ax, dy = by - ay;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lenSq));
      if (Math.sqrt((x - (ax + t * dx)) ** 2 + (y - (ay + t * dy)) ** 2) <= tolerance) return true;
    }
    return false;
  }
  if (shape.type === "text") {
    // Rough bounding box: 20px font height, estimate width
    return x >= shape.x && x <= shape.x + shape.content.length * 11 &&
           y >= shape.y - 20 && y <= shape.y + 6;
  }
  return false;
}

//Every shape stores its position differently, a rect has x/y/w/h, a circle has centerX/centerY/radius, a pencil has an array of points.
//This function normalizes all of them into one consistent format { x, y, w, h }.

function getSelectionBounds(shape: Shape) {
  const pad = 8;
  if (shape.type === "rect") return { x: shape.x - pad, y: shape.y - pad, w: shape.width + pad * 2, h: shape.height + pad * 2 };
  if (shape.type === "circle") return { x: shape.centerX - shape.radius - pad, y: shape.centerY - shape.radius - pad, w: (shape.radius + pad) * 2, h: (shape.radius + pad) * 2 };
  if (shape.type === "line" || shape.type === "arrow") {
    const minX = Math.min(shape.x1, shape.x2), minY = Math.min(shape.y1, shape.y2);
    const maxX = Math.max(shape.x1, shape.x2), maxY = Math.max(shape.y1, shape.y2);
    return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }
  if (shape.type === "pencil") {
    const xs = shape.points.map(p => p.x), ys = shape.points.map(p => p.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const maxX = Math.max(...xs), maxY = Math.max(...ys);
    return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }
  if (shape.type === "text") {
    return { x: shape.x - pad, y: shape.y - 20 - pad, w: shape.content.length * 11 + pad * 2, h: 26 + pad * 2 };
  }
  return null;
}

//
function moveShape(shape: Shape, dx: number, dy: number): Shape {
  if (shape.type === "rect")   return { ...shape, x: shape.x + dx, y: shape.y + dy };
  if (shape.type === "circle") return { ...shape, centerX: shape.centerX + dx, centerY: shape.centerY + dy };
  if (shape.type === "line")   return { ...shape, x1: shape.x1 + dx, y1: shape.y1 + dy, x2: shape.x2 + dx, y2: shape.y2 + dy };
  if (shape.type === "arrow")  return { ...shape, x1: shape.x1 + dx, y1: shape.y1 + dy, x2: shape.x2 + dx, y2: shape.y2 + dy };
  if (shape.type === "pencil") return { ...shape, points: shape.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
  if (shape.type === "text")   return { ...shape, x: shape.x + dx, y: shape.y + dy };
  return shape;
}