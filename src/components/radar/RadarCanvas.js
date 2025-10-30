"use client";
import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

/**
 * RadarCanvas - Renders Mermaid quadrantChart with circle underlay and sweep animation
 * @param {Object} props
 * @param {string} props.mermaidDiagram - Mermaid diagram code
 * @param {string} [props.previousMermaidDiagram] - Previous diagram for diff visualization
 */
export default function RadarCanvas({
  mermaidDiagram,
  previousMermaidDiagram,
  highlightQuery,
}) {
  const mermaidRef = useRef(null);
  const canvasRef = useRef(null);
  const sweepRef = useRef(null);
  const containerRef = useRef(null);
  const [rendered, setRendered] = useState(false);
  const [svgBounds, setSvgBounds] = useState(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
    });
  }, []);

  useEffect(() => {
    const renderMermaid = async () => {
      if (!mermaidDiagram || !mermaidRef.current) {
        console.log("Missing mermaidDiagram or ref:", {
          mermaidDiagram,
          hasRef: !!mermaidRef.current,
        });
        return;
      }

      try {
        // Clear previous content
        mermaidRef.current.innerHTML = "";

        // Generate unique ID for this render
        const uniqueId = `radar-diagram-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 11)}`;

        // Render mermaid
        console.log("Rendering Mermaid diagram with ID:", uniqueId);
        const { svg } = await mermaid.render(uniqueId, mermaidDiagram);
        mermaidRef.current.innerHTML = svg;

        // Wait for SVG to be in DOM, then find its bounds
        setTimeout(() => {
          const svgElement = mermaidRef.current.querySelector("svg");
          if (svgElement) {
            // Try multiple strategies to find the actual quadrant chart plotting area
            const svgRect = svgElement.getBoundingClientRect();
            let contentRect = null;

            // Strategy 1: Find content group by class/ID
            const quadrantGroup = svgElement.querySelector(
              "g.quadrant-chart, g[class*='quadrant'], g.quadrant, g[id*='quadrant']"
            );
            const plottingArea = svgElement.querySelector(
              "g.plot, g.plot-area, g[id*='plot']"
            );
            const contentGroup = quadrantGroup || plottingArea;

            if (contentGroup) {
              contentRect = contentGroup.getBoundingClientRect();
            } else {
              // Strategy 2: Find bounds of actual plotted elements (axes, quadrants, points)
              const plottedElements = svgElement.querySelectorAll(
                "g[class*='axis'], g[class*='quadrant'], circle, text, rect[class*='quadrant'], line[class*='axis']"
              );

              if (plottedElements.length > 0) {
                let minX = Infinity,
                  minY = Infinity,
                  maxX = -Infinity,
                  maxY = -Infinity;
                plottedElements.forEach((el) => {
                  const rect = el.getBoundingClientRect();
                  minX = Math.min(minX, rect.left);
                  minY = Math.min(minY, rect.top);
                  maxX = Math.max(maxX, rect.right);
                  maxY = Math.max(maxY, rect.bottom);
                });

                if (minX !== Infinity) {
                  contentRect = {
                    left: minX,
                    top: minY,
                    width: maxX - minX,
                    height: maxY - minY,
                    right: maxX,
                    bottom: maxY,
                  };
                }
              }
            }

            // Strategy 3: Use viewBox calculation if still no bounds
            if (!contentRect) {
              const viewBox = svgElement.getAttribute("viewBox");
              if (viewBox) {
                const values = viewBox
                  .split(/\s+|,/)
                  .filter((v) => v)
                  .map(parseFloat);
                if (values.length >= 4) {
                  const [x, y, width, height] = values;
                  const svgWidth = svgRect.width;
                  const svgHeight = svgRect.height;

                  // Calculate scale and offset based on viewBox
                  const scaleX = svgWidth / width;
                  const scaleY = svgHeight / height;
                  const scale = Math.min(scaleX, scaleY);

                  const scaledWidth = width * scale;
                  const scaledHeight = height * scale;
                  const offsetX = (svgWidth - scaledWidth) / 2 - x * scale;
                  const offsetY = (svgHeight - scaledHeight) / 2 - y * scale;

                  contentRect = {
                    left: svgRect.left + offsetX,
                    top: svgRect.top + offsetY,
                    width: scaledWidth,
                    height: scaledHeight,
                    right: svgRect.left + offsetX + scaledWidth,
                    bottom: svgRect.top + offsetY + scaledHeight,
                  };
                }
              }
            }

            // Strategy 4: Fallback to SVG bounds
            if (!contentRect) {
              contentRect = svgRect;
            }

            const containerRect =
              mermaidRef.current.parentElement.getBoundingClientRect();

            // Calculate content bounds relative to container
            const bounds = {
              x: contentRect.left - containerRect.left,
              y: contentRect.top - containerRect.top,
              width: contentRect.width || contentRect.right - contentRect.left,
              height:
                contentRect.height || contentRect.bottom - contentRect.top,
              centerX:
                contentRect.left -
                containerRect.left +
                (contentRect.width || contentRect.right - contentRect.left) / 2,
              centerY:
                contentRect.top -
                containerRect.top +
                (contentRect.height || contentRect.bottom - contentRect.top) /
                  2,
            };

            setSvgBounds(bounds);

            // Make SVG background transparent
            svgElement.style.backgroundColor = "transparent";

            // Define quadrant color palette - lighter/brighter green shades
            // Ordered by importance: Core Focus (brightest) -> Key Topics -> Watchlist -> Secondary
            const quadrantColors = {
              "core focus": "#2d7a3d", // Bright green for most important
              "focus areas": "#2d7a3d",
              "key topics": "#3a8a4d", // Bright green-blue
              watchlist: "#4a9a5d", // Medium green
              secondary: "#5aaa6d", // Lighter green
              "secondary interests": "#5aaa6d",
            };

            // Find quadrant labels from text elements
            const quadrantLabels = {};
            const allTexts = svgElement.querySelectorAll("text");
            allTexts.forEach((textEl) => {
              const text = (textEl.textContent || "").toLowerCase().trim();
              const bbox = textEl.getBoundingClientRect();
              const svgRect = svgElement.getBoundingClientRect();
              const centerX = bbox.left + bbox.width / 2 - svgRect.left;
              const centerY = bbox.top + bbox.height / 2 - svgRect.top;

              // Check if this text matches known quadrant labels
              for (const [key, color] of Object.entries(quadrantColors)) {
                if (text.includes(key)) {
                  // Determine quadrant position: top-left (1), top-right (2), bottom-left (3), bottom-right (4)
                  const viewBox = svgElement.viewBox?.baseVal;
                  const svgWidth = viewBox ? viewBox.width : svgRect.width;
                  const svgHeight = viewBox ? viewBox.height : svgRect.height;
                  const relX = centerX / svgWidth;
                  const relY = centerY / svgHeight;

                  let quadrantNum;
                  if (relX < 0.5 && relY < 0.5) {
                    quadrantNum = 3; // bottom-left
                  } else if (relX >= 0.5 && relY < 0.5) {
                    quadrantNum = 4; // bottom-right
                  } else if (relX < 0.5 && relY >= 0.5) {
                    quadrantNum = 1; // top-left
                  } else {
                    quadrantNum = 2; // top-right
                  }

                  quadrantLabels[quadrantNum] = {
                    text,
                    color,
                    centerX: relX,
                    centerY: relY,
                  };
                  break;
                }
              }
            });

            const protectedFills = new Set(
              Object.values(quadrantColors)
                .map((c) => c.toLowerCase())
                .concat(["#0f3a05"])
            );

            // Find the quadrant chart group if it exists
            const quadScope =
              svgElement.querySelector(
                "g.quadrant-chart, g[class*='quadrant'], g[id*='quadrant']"
              ) || svgElement;

            // Find all rectangles that could be quadrants
            const candidateRects = Array.from(
              quadScope.querySelectorAll("rect")
            ).filter((r) => {
              const cls = (r.getAttribute("class") || "").toLowerCase();
              if (cls.includes("background")) return false;

              const w = parseFloat(r.getAttribute("width") || "0");
              const h = parseFloat(r.getAttribute("height") || "0");
              const area = w * h;

              const viewBox = svgElement.viewBox?.baseVal;
              const maxArea = viewBox
                ? viewBox.width * viewBox.height
                : svgRect.width * svgRect.height;

              return area > 1000 && area < maxArea * 0.8;
            });

            // Map each rect to a quadrant based on position
            const quadrantRects = candidateRects
              .map((r) => {
                const w = parseFloat(r.getAttribute("width") || "0");
                const h = parseFloat(r.getAttribute("height") || "0");
                const x = parseFloat(r.getAttribute("x") || "0");
                const y = parseFloat(r.getAttribute("y") || "0");
                const centerX = x + w / 2;
                const centerY = y + h / 2;

                const viewBox = svgElement.viewBox?.baseVal;
                const svgWidth = viewBox ? viewBox.width : svgRect.width;
                const svgHeight = viewBox ? viewBox.height : svgRect.height;
                const relX = centerX / svgWidth;
                const relY = centerY / svgHeight;

                // Determine quadrant: 1=top-left, 2=top-right, 3=bottom-left, 4=bottom-right
                let quadrantNum;
                if (relX < 0.5 && relY < 0.5) {
                  quadrantNum = 3;
                } else if (relX >= 0.5 && relY < 0.5) {
                  quadrantNum = 4;
                } else if (relX < 0.5 && relY >= 0.5) {
                  quadrantNum = 1;
                } else {
                  quadrantNum = 2;
                }

                return {
                  r: r,
                  area: w * h,
                  quadrantNum,
                };
              })
              .sort((a, b) => b.area - a.area)
              .slice(0, 4);

            // Apply colors based on quadrant labels
            quadrantRects.forEach(({ r, quadrantNum }) => {
              // Use the color from the label if available, otherwise use default palette
              const labelInfo = quadrantLabels[quadrantNum];
              const color = labelInfo
                ? labelInfo.color
                : Object.values(quadrantColors)[quadrantNum - 1] || "#2d7a3d";

              r.setAttribute("fill", color);
              r.setAttribute("fill-opacity", "0.54");
              r.style.fill = color;
              r.style.opacity = "1";
            });

            // Also handle any remaining white-ish backgrounds as fallback
            const bgElements = svgElement.querySelectorAll(
              "rect[fill='#ffffff'], rect[fill='white'], rect[fill='#fbfbff'], rect[fill='#FBFBFF'], rect[fill='rgb(251, 251, 255)'], .background"
            );
            const quadrantRectElements = quadrantRects.map((q) => q.r);
            bgElements.forEach((el) => {
              // Only change if not already a quadrant rect
              if (!quadrantRectElements.includes(el)) {
                el.setAttribute("fill", "#0f3a05");
                el.setAttribute("fill-opacity", "0.24");
                el.style.fill = "#0f3a05";
                el.style.opacity = "1";
              }
            });

            // Make all text elements white (axis labels, titles, etc.)
            const allTextElements = svgElement.querySelectorAll("text");
            allTextElements.forEach((text) => {
              text.style.fill = "#ffffff";
              text.style.color = "#ffffff";
            });

            // Style dots (circles) with glowing green effects
            // Filter to only get data point circles (not axis markers or other circles)
            const allCircles = svgElement.querySelectorAll("circle");
            const dots = Array.from(allCircles).filter((circle) => {
              const r = parseFloat(circle.getAttribute("r") || "0");
              const cx = parseFloat(circle.getAttribute("cx") || "0");
              const cy = parseFloat(circle.getAttribute("cy") || "0");
              // Filter out very small circles (likely axis markers) and circles at exact center
              return r > 2 && (Math.abs(cx) > 5 || Math.abs(cy) > 5);
            });

            const dotData = [];
            const viewBox = svgElement.viewBox?.baseVal;
            const svgWidth = viewBox ? viewBox.width : svgRect.width;
            const svgHeight = viewBox ? viewBox.height : svgRect.height;
            const centerX = svgWidth / 2;
            const centerY = svgHeight / 2;

            // Green glow variations
            const glowColors = [
              "#32ff32", // Bright lime green
              "#4aff4a", // Lighter lime
              "#28ff7a", // Green-cyan
              "#3aff56", // Green-lime
            ];

            dots.forEach((dot, index) => {
              const cx = parseFloat(dot.getAttribute("cx") || "0");
              const cy = parseFloat(dot.getAttribute("cy") || "0");
              const glowColor = glowColors[index % glowColors.length];
              const baseRadius = parseFloat(dot.getAttribute("r") || "4");

              // Calculate angle from center to dot (in degrees, 0-360)
              // CSS rotation: 0deg = right, 90deg = down, 180deg = left, 270deg = up (clockwise)
              // atan2: 0 = right, 90 = down, 180 = left, -90 = up
              // atan2 matches CSS rotation, just normalize negative angles
              const dx = cx - centerX;
              const dy = cy - centerY;
              const atan2Angle = Math.atan2(dy, dx) * (180 / Math.PI);
              // Normalize to 0-360 range (convert -90 to 270)
              const normalizedAngle = ((atan2Angle % 360) + 360) % 360;

              dotData.push({
                element: dot,
                cx,
                cy,
                angle: normalizedAngle,
                glowColor,
                baseRadius,
              });

              // Apply glowing green style with variation
              dot.setAttribute("fill", glowColor);
              dot.setAttribute("stroke", glowColor);
              dot.setAttribute("stroke-width", "1");
              dot.setAttribute("opacity", "0.9");
              dot.setAttribute("r", baseRadius.toString());
              // Store values on dot element for event handlers to access
              dot.dataset.baseRadius = baseRadius.toString();
              dot.dataset.cx = cx.toString();
              dot.dataset.cy = cy.toString();
              dot.dataset.glowColor = glowColor;

              // Add glow filter if not exists
              let defs = svgElement.querySelector("defs");
              if (!defs) {
                defs = document.createElementNS(
                  "http://www.w3.org/2000/svg",
                  "defs"
                );
                svgElement.insertBefore(defs, svgElement.firstChild);
              }

              // Create unique filter ID for each dot
              const filterId = `glow-${index}`;
              let filter = svgElement.querySelector(`#${filterId}`);
              if (!filter) {
                filter = document.createElementNS(
                  "http://www.w3.org/2000/svg",
                  "filter"
                );
                filter.setAttribute("id", filterId);
                filter.setAttribute("x", "-50%");
                filter.setAttribute("y", "-50%");
                filter.setAttribute("width", "200%");
                filter.setAttribute("height", "200%");

                const feGaussianBlur = document.createElementNS(
                  "http://www.w3.org/2000/svg",
                  "feGaussianBlur"
                );
                feGaussianBlur.setAttribute("stdDeviation", "4"); // Increased for visibility
                feGaussianBlur.setAttribute("result", "coloredBlur");

                const feMerge = document.createElementNS(
                  "http://www.w3.org/2000/svg",
                  "feMerge"
                );
                const feMergeNode1 = document.createElementNS(
                  "http://www.w3.org/2000/svg",
                  "feMergeNode"
                );
                feMergeNode1.setAttribute("in", "coloredBlur");
                const feMergeNode2 = document.createElementNS(
                  "http://www.w3.org/2000/svg",
                  "feMergeNode"
                );
                feMergeNode2.setAttribute("in", "SourceGraphic");

                feMerge.appendChild(feMergeNode1);
                feMerge.appendChild(feMergeNode2);
                filter.appendChild(feGaussianBlur);
                filter.appendChild(feMerge);
                defs.appendChild(filter);
              }

              dot.setAttribute("filter", `url(#${filterId})`);
              dot.setAttribute("class", `radar-dot dot-${index}`);

              // Add hover effects
              dot.style.cursor = "pointer";
              const baseFilterId = filterId; // Store base filter for restoration

              dot.addEventListener("mouseenter", () => {
                const hoverFilterId = `glow-hover-${index}`;
                let hoverFilter = svgElement.querySelector(`#${hoverFilterId}`);
                if (!hoverFilter && defs) {
                  hoverFilter = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "filter"
                  );
                  hoverFilter.setAttribute("id", hoverFilterId);
                  hoverFilter.setAttribute("x", "-100%");
                  hoverFilter.setAttribute("y", "-100%");
                  hoverFilter.setAttribute("width", "300%");
                  hoverFilter.setAttribute("height", "300%");

                  const feGaussianBlur = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "feGaussianBlur"
                  );
                  feGaussianBlur.setAttribute("stdDeviation", "6");
                  feGaussianBlur.setAttribute("result", "coloredBlur");

                  const feMerge = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "feMerge"
                  );
                  const feMergeNode1 = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "feMergeNode"
                  );
                  feMergeNode1.setAttribute("in", "coloredBlur");
                  const feMergeNode2 = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "feMergeNode"
                  );
                  feMergeNode2.setAttribute("in", "SourceGraphic");

                  feMerge.appendChild(feMergeNode1);
                  feMerge.appendChild(feMergeNode2);
                  hoverFilter.appendChild(feGaussianBlur);
                  hoverFilter.appendChild(feMerge);
                  defs.appendChild(hoverFilter);
                }

                // Store current state to restore after hover
                dot.dataset.hovered = "true";
                const dotBaseRadius = parseFloat(dot.dataset.baseRadius);
                const dotGlowColor = dot.dataset.glowColor;
                dot.setAttribute("r", (dotBaseRadius * 1.1).toString()); // Minimal zoom: 1.1x (10% increase)
                dot.setAttribute("opacity", "1");
                dot.style.filter = `url(#${hoverFilterId}) drop-shadow(0 0 12px ${dotGlowColor})`;
              });

              dot.addEventListener("mouseleave", () => {
                dot.dataset.hovered = "false";

                // Restore to base filter (sweep glow will override if active)
                const dotBaseRadius = parseFloat(dot.dataset.baseRadius);
                dot.setAttribute("r", dotBaseRadius.toString());
                dot.setAttribute("opacity", "1");
                dot.style.filter = `url(#${baseFilterId})`;
              });
            });

            // Add hover effects to labels (text elements near dots)
            const allLabels = svgElement.querySelectorAll("text");
            allLabels.forEach((label, labelIndex) => {
              const labelText = label.textContent || "";
              // Skip quadrant labels and axis labels
              if (
                labelText.toLowerCase().includes("core focus") ||
                labelText.toLowerCase().includes("key topics") ||
                labelText.toLowerCase().includes("watchlist") ||
                labelText.toLowerCase().includes("secondary") ||
                labelText.toLowerCase().includes("low") ||
                labelText.toLowerCase().includes("high") ||
                labelText.toLowerCase().includes("relevance") ||
                labelText.toLowerCase().includes("priority") ||
                labelText.toLowerCase().includes("distribution")
              ) {
                return;
              }

              label.style.cursor = "pointer";
              label.style.transition = "fill 0.2s ease-out";

              // Create background for label readability
              const labelBgId = `label-bg-${labelIndex}`;
              let labelBg = svgElement.querySelector(`#${labelBgId}`);
              if (!labelBg) {
                labelBg = document.createElementNS(
                  "http://www.w3.org/2000/svg",
                  "rect"
                );
                labelBg.setAttribute("id", labelBgId);
                labelBg.setAttribute("fill", "rgba(0, 0, 0, 0.8)");
                labelBg.setAttribute("rx", "4");
                labelBg.setAttribute("ry", "4");
                labelBg.setAttribute("opacity", "0");
                labelBg.style.transition = "opacity 0.2s ease-out";
                labelBg.style.pointerEvents = "none";

                // Insert in the same parent as the label to ensure same coordinate space
                const parent = label.parentNode;
                if (parent && parent !== svgElement) {
                  // Insert before label so it appears behind
                  parent.insertBefore(labelBg, label);
                } else {
                  // Fallback: insert at end of SVG
                  svgElement.appendChild(labelBg);
                }
              }

              // Store reference on label for easy access
              label.dataset.bgId = labelBgId;

              label.addEventListener("mouseenter", () => {
                // Show background and update label
                const bgElement =
                  svgElement.querySelector(`#${labelBgId}`) || labelBg;
                if (bgElement) {
                  try {
                    // Get bounding box in SVG coordinate space
                    const bbox = label.getBBox();
                    const padding = 6;

                    // Ensure background is in same parent as label
                    const parent = label.parentNode;
                    if (bgElement.parentNode !== parent && parent) {
                      parent.insertBefore(bgElement, label);
                    }

                    bgElement.setAttribute("x", (bbox.x - padding).toString());
                    bgElement.setAttribute("y", (bbox.y - padding).toString());
                    bgElement.setAttribute(
                      "width",
                      (bbox.width + padding * 2).toString()
                    );
                    bgElement.setAttribute(
                      "height",
                      (bbox.height + padding * 2).toString()
                    );
                    bgElement.setAttribute("opacity", "1");
                    console.log("Label hover - Background shown:", {
                      x: bbox.x - padding,
                      y: bbox.y - padding,
                      width: bbox.width + padding * 2,
                      height: bbox.height + padding * 2,
                      label: labelText,
                      parent: parent?.tagName || "none",
                    });
                  } catch (e) {
                    console.warn("Could not get label bbox for:", labelText, e);
                  }
                } else {
                  console.warn("Background element not found for:", labelText);
                }

                label.style.fill = "#32ff32"; // Lime green for hover
                label.style.filter =
                  "drop-shadow(0 0 4px rgba(50, 255, 50, 0.8))";
              });

              label.addEventListener("mouseleave", () => {
                // Hide background
                const bgElement =
                  svgElement.querySelector(`#${labelBgId}`) || labelBg;
                if (bgElement) {
                  bgElement.setAttribute("opacity", "0");
                }

                label.style.fill = "#ffffff";
                label.style.filter = "";
              });
            });

            // Store dot data for sweep detection
            if (!svgElement.dataset.dotData) {
              svgElement.dataset.dotData = JSON.stringify(
                dotData.map((d) => ({
                  angle: d.angle,
                  cx: d.cx,
                  cy: d.cy,
                  glowColor: d.glowColor,
                  baseRadius: d.baseRadius,
                }))
              );
            }

            // Debug log
            console.log("Radar dots initialized:", dots.length, "dots found");
            console.log(
              "Dot angles:",
              dotData.map((d) => d.angle)
            );

            // Reduce opacity for other rectangles (not the quadrants we just colored)
            const allRects = svgElement.querySelectorAll("rect");
            allRects.forEach((r) => {
              // Skip if this is one of our quadrant rects
              if (quadrantRectElements.includes(r)) {
                return;
              }
              const fill = (r.getAttribute("fill") || "").toLowerCase();
              if (!fill || fill === "none" || protectedFills.has(fill)) {
                return;
              }
              // Soften any other solid backgrounds
              r.setAttribute("fill-opacity", "0.27"); // ~0x44 / 255
            });
          }
        }, 100);

        // Add CSS for circle underlay and sweep
        const style = document.createElement("style");
        style.textContent = `
          .radar-container {
            position: relative;
            width: 100%;
            height: 100%;
            min-height: 400px;
          }
          .radar-canvas-wrapper {
            position: absolute;
            pointer-events: none;
          }
          .radar-sweep {
            position: absolute;
            pointer-events: none;
          }
          @keyframes sweep {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
          .radar-mermaid {
            position: relative;
            z-index: 1;
          }
          .radar-mermaid svg {
            background: transparent !important;
          }
          .radar-mermaid svg rect[fill="#ffffff"],
          .radar-mermaid svg rect[fill="white"],
          .radar-mermaid svg rect[fill="#fbfbff"],
          .radar-mermaid svg rect[fill="#FBFBFF"],
          .radar-mermaid svg rect[fill="rgb(251, 251, 255)"] {
            fill: #0f3a05 !important;
          }
          .radar-mermaid svg circle.radar-dot {
            transition: opacity 0.05s ease-out, r 0.05s ease-out;
          }
        `;
        if (!document.getElementById("radar-canvas-styles")) {
          style.id = "radar-canvas-styles";
          document.head.appendChild(style);
        }

        setRendered(true);
      } catch (error) {
        console.error("Error rendering Mermaid:", error);
        console.error("Diagram code:", mermaidDiagram);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `
            <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-600 font-semibold mb-2">Error rendering diagram</p>
              <p class="text-red-700 text-sm">${error.message}</p>
              <details class="mt-2">
                <summary class="text-red-600 text-sm cursor-pointer">Show diagram code</summary>
                <pre class="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">${mermaidDiagram}</pre>
              </details>
            </div>
          `;
        }
      }
    };

    renderMermaid();
  }, [mermaidDiagram]);

  // Soft-highlight labels/dots matching highlightQuery
  useEffect(() => {
    const svgElement = mermaidRef.current?.querySelector("svg");
    if (!svgElement) return;

    // Reset prior highlights
    const reset = () => {
      const highlighted = svgElement.querySelectorAll(
        ".radar-highlight-label, .radar-highlight-dot"
      );
      highlighted.forEach((el) => {
        if (el.tagName.toLowerCase() === "text") {
          el.style.fill = "#ffffff";
          el.style.filter = "";
          el.classList.remove("radar-highlight-label");
        } else if (el.tagName.toLowerCase() === "circle") {
          el.style.outline = "";
          el.style.filter = el.dataset.baseFilter || el.style.filter;
          el.classList.remove("radar-highlight-dot");
        }
      });
    };

    reset();

    const q = (highlightQuery || "").trim().toLowerCase();
    if (!q) return;

    // Highlight labels that include the query
    const labels = svgElement.querySelectorAll("text");
    labels.forEach((label) => {
      const text = (label.textContent || "").toLowerCase();
      if (!text || text.length < 2) return;
      if (text.includes(q)) {
        label.style.fill = "#ffef5a"; // bright yellow
        label.style.filter = "drop-shadow(0 0 6px rgba(255,239,90,0.9))";
        label.classList.add("radar-highlight-label");
      }
    });

    // Optionally accent the nearest dots by increasing glow
    const dots = svgElement.querySelectorAll(
      "circle[class*='radar-dot'], circle.radar-dot"
    );
    dots.forEach((dot) => {
      // Light touch: add an extra shadow so it pops
      const existing = dot.style.filter || "";
      dot.dataset.baseFilter = existing;
      dot.style.filter = `${existing} drop-shadow(0 0 10px rgba(255,239,90,0.9))`;
      dot.classList.add("radar-highlight-dot");
    });

    // Cleanup when query changes
    return () => reset();
  }, [highlightQuery, rendered]);

  // Track sweep line and make dots glow when line passes by
  useEffect(() => {
    if (!rendered || !mermaidRef.current || !sweepRef.current) return;

    let animationFrameId;
    let timeoutId;

    // Wait a bit for SVG to be fully processed
    timeoutId = setTimeout(() => {
      const sweepDuration = 8000; // 8 seconds per rotation - must match CSS animation duration
      const angleThreshold = 25; // degrees - how close the sweep needs to be to trigger glow
      const startTime = Date.now();

      const updateDotGlow = () => {
        const svgElement = mermaidRef.current?.querySelector("svg");
        if (!svgElement || !sweepRef.current) {
          animationFrameId = requestAnimationFrame(updateDotGlow);
          return;
        }

        // Get all dots (query directly, don't rely on class)
        const dots = svgElement.querySelectorAll(
          "circle[class*='radar-dot'], circle.radar-dot"
        );
        const dotDataStr = svgElement.dataset.dotData;

        if (!dotDataStr || dots.length === 0) {
          animationFrameId = requestAnimationFrame(updateDotGlow);
          return;
        }

        // Get current rotation angle from the sweep animation
        // Try to read the actual computed transform, fallback to time-based calculation
        let currentAngle = 0;
        try {
          const computedStyle = window.getComputedStyle(sweepRef.current);
          const transform = computedStyle.transform;
          if (transform && transform !== "none") {
            // Parse matrix: matrix(cos, sin, -sin, cos, tx, ty)
            const matrix = transform.match(/matrix\(([^)]+)\)/);
            if (matrix) {
              const values = matrix[1]
                .split(",")
                .map((v) => parseFloat(v.trim()));
              // CSS transform matrix: [a, b, c, d, tx, ty]
              // For rotation: a = cos(θ), b = sin(θ), c = -sin(θ), d = cos(θ)
              const angleRad = Math.atan2(values[1], values[0]);
              currentAngle = (angleRad * (180 / Math.PI) + 360) % 360;
            } else {
              // Fallback to time-based
              const elapsed = (Date.now() - startTime) % sweepDuration;
              const progress = elapsed / sweepDuration;
              currentAngle = progress * 360;
            }
          } else {
            // Fallback to time-based
            const elapsed = (Date.now() - startTime) % sweepDuration;
            const progress = elapsed / sweepDuration;
            currentAngle = progress * 360;
          }
        } catch (e) {
          // Fallback to time-based calculation
          const elapsed = (Date.now() - startTime) % sweepDuration;
          const progress = elapsed / sweepDuration;
          currentAngle = progress * 360;
        }

        const dotData = JSON.parse(dotDataStr);
        let glowActive = false;

        dots.forEach((dot, index) => {
          if (index >= dotData.length) return;

          const dotAngle = dotData[index].angle;
          // Use dataset baseRadius if available, otherwise fallback to dotData
          const baseRadius =
            parseFloat(dot.dataset.baseRadius) ||
            dotData[index].baseRadius ||
            4;
          const glowColor = dotData[index].glowColor || "#32ff32";

          // Calculate angle difference (handle wrap-around)
          let angleDiff = Math.abs(currentAngle - dotAngle);
          if (angleDiff > 180) {
            angleDiff = 360 - angleDiff;
          }

          // If sweep is close to dot, increase glow
          if (angleDiff < angleThreshold) {
            glowActive = true;
            const proximity = 1 - angleDiff / angleThreshold; // 0 to 1
            const glowIntensity = 0.9 + proximity * 0.1; // 0.9 to 1.0
            const glowSize = 6 + proximity * 8; // 6 to 14 - more pronounced
            const radius = baseRadius * (1 + proximity * 0.3); // Slightly larger when glowing

            // Don't override hover state
            if (dot.dataset.hovered !== "true") {
              // Update glow filter
              const filterId = `glow-${index}`;
              let filter = svgElement.querySelector(`#${filterId}`);
              if (filter) {
                const blur = filter.querySelector("feGaussianBlur");
                if (blur) {
                  blur.setAttribute("stdDeviation", glowSize.toString());
                }
              }

              // Update dot properties with more pronounced effect
              // Remove transition temporarily to ensure immediate update
              dot.style.transition = "none";
              dot.setAttribute("r", radius.toString());
              dot.setAttribute(
                "opacity",
                Math.min(1, glowIntensity).toString()
              );

              // Force reflow and apply filter
              void dot.offsetHeight; // Force reflow
              dot.style.filter = `url(#${filterId}) drop-shadow(0 0 ${
                glowSize * 3
              }px ${glowColor})`;

              // Re-enable transition for smooth changes
              setTimeout(() => {
                dot.style.transition =
                  "opacity 0.05s ease-out, r 0.05s ease-out";
              }, 0);
            }
          } else {
            // Reset to normal glow (unless hovered)
            if (dot.dataset.hovered !== "true") {
              const filterId = `glow-${index}`;
              let filter = svgElement.querySelector(`#${filterId}`);
              if (filter) {
                const blur = filter.querySelector("feGaussianBlur");
                if (blur) {
                  blur.setAttribute("stdDeviation", "4"); // Match initial glow
                }
              }

              // Remove transition temporarily
              dot.style.transition = "none";
              dot.setAttribute("r", baseRadius.toString());
              dot.setAttribute("opacity", "0.9"); // Match original opacity
              void dot.offsetHeight; // Force reflow
              dot.style.filter = `url(#${filterId})`;

              // Re-enable transition
              setTimeout(() => {
                dot.style.transition =
                  "opacity 0.05s ease-out, r 0.05s ease-out";
              }, 0);
            }
          }
        });

        // Debug log every 60 frames (roughly once per second)
        if (Math.random() < 0.016) {
          console.log(
            "Sweep angle:",
            currentAngle.toFixed(1),
            "° | Dots:",
            dots.length,
            "| Glow active:",
            glowActive
          );
          // Log angle differences for first dot
          if (dotData.length > 0) {
            const firstDotAngle = dotData[0].angle;
            let angleDiff = Math.abs(currentAngle - firstDotAngle);
            if (angleDiff > 180) {
              angleDiff = 360 - angleDiff;
            }
            console.log(
              "First dot angle:",
              firstDotAngle.toFixed(1),
              "° | Angle diff:",
              angleDiff.toFixed(1),
              "° | Threshold:",
              angleThreshold
            );
          }
        }

        animationFrameId = requestAnimationFrame(updateDotGlow);
      };

      // Start the animation loop
      animationFrameId = requestAnimationFrame(updateDotGlow);
    }, 300); // Wait 300ms for SVG to be fully processed

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [rendered, mermaidDiagram]);

  // Draw circle overlay on canvas, positioned at SVG center
  useEffect(() => {
    if (!canvasRef.current || !rendered || !svgBounds || !containerRef.current)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const container = containerRef.current;

    if (!container) return;

    const resizeCanvas = () => {
      const containerRect = container.getBoundingClientRect();
      const svgElement = mermaidRef.current?.querySelector("svg");

      if (!svgElement) return;

      const svgRect = svgElement.getBoundingClientRect();
      const relativeSvgRect = {
        x: svgRect.left - containerRect.left,
        y: svgRect.top - containerRect.top,
        width: svgRect.width,
        height: svgRect.height,
      };

      // Canvas size should be large enough for the circles
      const maxRadius = Math.min(svgRect.width, svgRect.height) * 0.4;
      const canvasSize = maxRadius * 2 + 40; // padding

      canvas.width = canvasSize;
      canvas.height = canvasSize;

      canvas.style.width = `${canvasSize}px`;
      canvas.style.height = `${canvasSize}px`;

      // Draw concentric circles centered on canvas (which is centered in SVG via wrapper)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw 3 concentric circles
      for (let i = 1; i <= 3; i++) {
        const radius = (maxRadius / 3) * i;
        ctx.strokeStyle = `rgba(59, 130, 246, ${0.3 / i})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Update sweep width to match circle radius
      if (sweepRef.current) {
        sweepRef.current.style.width = `${maxRadius * 2}px`;
      }
    };

    resizeCanvas();

    // Use ResizeObserver to watch for SVG size changes
    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (mermaidRef.current) {
      const svgElement = mermaidRef.current.querySelector("svg");
      if (svgElement) {
        resizeObserver.observe(svgElement);
      }
    }

    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      resizeObserver.disconnect();
    };
  }, [rendered, svgBounds]);

  if (!mermaidDiagram) {
    return (
      <div className="card-sleek">
        <p className="text-gray-400 text-center text-sm">
          No diagram available
        </p>
      </div>
    );
  }

  return (
    <div className="card-sleek">
      <div
        ref={containerRef}
        className="radar-container relative"
        style={{ minHeight: "400px" }}
      >
        {/* Wrapper to mask radar animation to SVG bounds */}
        {svgBounds && (
          <div
            style={{
              position: "absolute",
              left: `${svgBounds.x}px`,
              top: `${svgBounds.y}px`,
              width: `${svgBounds.width}px`,
              height: `${svgBounds.height}px`,
              overflow: "hidden",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {/* Canvas for circle overlay - centered in SVG */}
            <canvas
              ref={canvasRef}
              className="absolute pointer-events-none"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 0,
              }}
            />

            {/* Sweep line - centered in SVG */}
            <div
              ref={sweepRef}
              className="radar-sweep"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "200px",
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, rgba(50, 255, 50, 0.8), transparent)",
                boxShadow: "0 0 8px rgba(50, 255, 50, 0.6)",
                transformOrigin: "center center",
                animation: "sweep 8s linear infinite",
              }}
            />
          </div>
        )}

        {/* Mermaid diagram */}
        <div
          ref={mermaidRef}
          className="radar-mermaid"
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100%",
            minHeight: "400px",
          }}
        />
      </div>
    </div>
  );
}
