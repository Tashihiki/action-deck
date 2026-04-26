// =============================================================================
// svg-utils.ts
// =============================================================================

export function sanitizeSVG(svgStr: string): string {
  if (!svgStr) return "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgStr, "image/svg+xml");
    
    // Remove <script> tags
    const scripts = doc.querySelectorAll("script");
    for (let i = 0; i < scripts.length; i++) {
        scripts[i].remove();
    }
    
    // Remove on* attributes and dangerous URI schemes (XSS mitigation)
    const allElements = doc.querySelectorAll("*");
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const attrName = attr.name.toLowerCase();
        const attrValue = attr.value.toLowerCase().replace(/\s/g, "");
        
        const isEvent = attrName.startsWith("on");
        const isDangerousScheme = attrValue.startsWith("javascript:") || 
                                 attrValue.startsWith("data:text/html") || 
                                 attrValue.startsWith("vbscript:");

        if (isEvent || isDangerousScheme) {
          el.removeAttribute(attr.name);
        }
      }
    }
    
    const svg = doc.querySelector("svg");
    if (svg) {
        // Also remove risky elements inside iframe or foreignObject
        const foreign = svg.querySelectorAll("foreignObject, iframe, object, embed");
        for (let i = 0; i < foreign.length; i++) foreign[i].remove();
        
        return new XMLSerializer().serializeToString(svg);
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * Safely appends sanitized SVG to a parent element using DOM APIs
 */
export function setSanitizedSVG(parent: HTMLElement, svgStr: string): void {
  parent.empty();
  if (!svgStr) return;
  try {
    const sanitized = sanitizeSVG(svgStr);
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitized, "image/svg+xml");
    const svgEl = doc.querySelector("svg");
    if (svgEl) {
      // Import the node to the current document
      const node = document.importNode(svgEl, true);
      parent.appendChild(node);
    }
  } catch {
    // ignore
  }
}
