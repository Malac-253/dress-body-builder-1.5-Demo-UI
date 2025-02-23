// animationFunctionsLibrary.js

/**
 * Adds text to the given SVG at (x,y), with styling from the param object.
 * @param {SVGElement} svgElement - The hidden SVG in which to place text.
 * @param {Object} params - e.g. { textString, x, y, fontSize, color }
 */
function addTextToSVG(svgElement, params) {
    // Basic example:
    const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textEl.setAttribute("x", params.x || 50);
    textEl.setAttribute("y", params.y || 50);
    textEl.setAttribute("fill", params.color || "#000");
    textEl.setAttribute("font-size", params.fontSize || 14);
    // If you want to handle styling, do it here
    textEl.textContent = params.textString || "Hello!";
  
    svgElement.appendChild(textEl);
  }
  