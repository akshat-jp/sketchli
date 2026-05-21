import { useState } from "react";
import type { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToolId =
  | "selector"
  | "rect"
  | "circle"
  | "line"
  | "arrow"
  | "pencil"
  | "text"
  | "eraser";

interface Tool {
  id: ToolId;
  label: string;
  key: string;
}

interface ToolButtonProps {
  tool: Tool;
  isActive: boolean;
  onSelect: (id: ToolId) => void;
}

// ─── Icon paths (render-only, no wrapper SVG) ─────────────────────────────────
// Keyed by ToolId so lookup is type-safe and no .props.children access needed.

const iconPaths: Record<ToolId, ReactNode> = {
  selector: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 3 L4 15 L8 11.5 L10.5 17 L12.5 16 L10 10.5 L15 10.5 Z"
    />
  ),
  rect: (
    <rect
      x="3.5"
      y="4.5"
      width="13"
      height="11"
      rx="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  circle: <circle cx="10" cy="10" r="6.5" />,
  line: <line strokeLinecap="round" x1="4" y1="16" x2="16" y2="4" />,
  arrow: (
    <>
      <line strokeLinecap="round" strokeLinejoin="round" x1="4" y1="16" x2="15" y2="5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5 L10 5.5 M15 5 L14.5 10" />
    </>
  ),
  pencil: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 15 L4.5 11.5 L13 3 Q14.5 1.5 16 3 Q17.5 4.5 16 6 L7.5 14.5 Z"
      />
      <line strokeLinecap="round" x1="4.5" y1="11.5" x2="7.5" y2="14.5" />
    </>
  ),
  text: (
    <>
      <line strokeLinecap="round" x1="5" y1="5.5" x2="15" y2="5.5" />
      <line strokeLinecap="round" x1="10" y1="5.5" x2="10" y2="16" />
      <line strokeLinecap="round" x1="7.5" y1="16" x2="12.5" y2="16" />
    </>
  ),
  eraser: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 15 L9 9 L15 14 L12.5 16 Z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
        d="M9 9 L13 5 L17 9 L15 11 Z"
      />
      <line strokeLinecap="round" x1="4" y1="16" x2="17" y2="16" />
    </>
  ),
};

// ─── Tool groups ──────────────────────────────────────────────────────────────

const TOOL_GROUPS: Tool[][] = [
  [{ id: "selector", label: "Selector", key: "V" }],
  [
    { id: "rect",   label: "Rectangle", key: "R" },
    { id: "circle", label: "Circle",    key: "O" },
  ],
  [
    { id: "line",  label: "Line",  key: "L" },
    { id: "arrow", label: "Arrow", key: "A" },
  ],
  [
    { id: "pencil", label: "Pencil", key: "P" },
    { id: "text",   label: "Text",   key: "T" },
  ],
  [{ id: "eraser", label: "Eraser", key: "E" }],
];

// ─── ToolButton ───────────────────────────────────────────────────────────────

function ToolButton({ tool, isActive, onSelect }: ToolButtonProps) {
  const [hovered, setHovered] = useState<boolean>(false);

  return (
    <button
      type="button"
      aria-label={`${tool.label} (${tool.key})`}
      aria-pressed={isActive}
      onClick={() => onSelect(tool.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: 48,
        height: 48,
        border: "none",
        borderRadius: 12,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        outline: "none",
        transition: "background 160ms ease, transform 140ms ease, box-shadow 160ms ease",
        background: isActive ? "#ededff" : hovered ? "#f2f2ee" : "transparent",
        boxShadow: isActive
          ? "0 0 0 1px #c0c0f0, inset 0 1px 0 rgba(255,255,255,0.9)"
          : hovered
          ? "0 2px 8px rgba(0,0,0,0.07)"
          : "none",
        transform: hovered && !isActive ? "translateY(-1px)" : "none",
      }}
    >
      {/* Tooltip */}
      <span
        role="tooltip"
        style={{
          position: "absolute",
          bottom: "calc(100% + 10px)",
          left: "50%",
          transform: hovered
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(4px)",
          background: "#1c1c1a",
          color: "#e8e8e4",
          fontFamily: "'Geist Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.04em",
          padding: "5px 9px",
          borderRadius: 7,
          whiteSpace: "nowrap",
          border: "1px solid #2e2e2a",
          pointerEvents: "none",
          opacity: hovered ? 1 : 0,
          transition: "opacity 130ms ease, transform 130ms ease",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {tool.label}
        <span
          style={{
            background: "#2e2e2a",
            color: "#7878a0",
            fontSize: 10,
            padding: "2px 5px",
            borderRadius: 4,
            border: "1px solid #3c3c38",
          }}
        >
          {tool.key}
        </span>
      </span>

      {/* Icon */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          transition: "transform 200ms cubic-bezier(0.34,1.56,0.64,1)",
          transform: hovered || isActive ? "scale(1.15)" : "scale(1)",
        }}
      >
        <svg
          viewBox="0 0 20 20"
          width={22}
          height={22}
          fill="none"
          stroke={isActive ? "#4848b8" : hovered ? "#1a1a18" : "#b0b0a8"}
          strokeWidth={1.6}
          style={{ transition: "stroke 160ms ease" }}
          aria-hidden="true"
        >
          {iconPaths[tool.id]}
        </svg>
      </span>

      {/* Active dot */}
      {isActive && (
        <span
          style={{
            position: "absolute",
            bottom: 4,
            left: "50%",
            transform: "translateX(-50%)",
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#6060cc",
          }}
        />
      )}
    </button>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 1,
        height: 28,
        background: "#e8e8e2",
        margin: "0 3px",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Main Toolbar ─────────────────────────────────────────────────────────────

interface DrawingToolbarProps {
    activeTool: ToolId;
    onToolChange: (id: ToolId) => void;
}

export default function DrawingToolbarLight({ activeTool, onToolChange }: DrawingToolbarProps) {

//   const [activeTool, setActiveTool] = useState<ToolId>("selector");

  return (
    <div
      role="toolbar"
      aria-label="Drawing tools"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        background: "#ffffff",
        border: "1px solid #e4e4dc",
        borderRadius: 16,
        padding: 6,
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.04)",
      }}
    >
      {TOOL_GROUPS.map((group, gi) => (
        <span key={gi} style={{ display: "contents" }}>
          {gi > 0 && <Divider />}
          {group.map((tool) => (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={activeTool === tool.id}
              onSelect={onToolChange}
            />
          ))}
        </span>
      ))}
    </div>
  );
}

export type { ToolId };