import { useCallback, useEffect, useRef } from 'react';
import { cn } from '../../utils/format';

// Breaks a paragraph into lines that fit `width`. A word wider than a whole
// line (only possible on very narrow screens) is split by characters.
function wrap(ctx, text, width) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= width) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    while (ctx.measureText(line).width > width && line.length > 1) {
      let cut = line.length - 1;
      while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > width) cut -= 1;
      lines.push(line.slice(0, cut));
      line = line.slice(cut);
    }
  }
  if (line) lines.push(line);
  return lines;
}

const prevent = (event) => event.preventDefault();

// Draws text on a canvas instead of writing it in the page, so it can be read
// but not selected, copied or pasted into an online decoder. The canvas takes
// its font, size, line height and color from the CSS of its container, keeps
// the container's width and redraws when the width or the fonts change.
export default function CanvasText({ paragraphs, label, className }) {
  const boxRef = useRef(null);
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext?.('2d');
    if (!box || !ctx) return;

    const style = getComputedStyle(box);
    const width = box.clientWidth;
    if (!width) return;
    const fontSize = parseFloat(style.fontSize) || 16;
    const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.625;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const gap = rem * 1.25;
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    ctx.font = font;
    const blocks = paragraphs.map((text) => wrap(ctx, text, width));
    const lineCount = blocks.reduce((sum, lines) => sum + lines.length, 0);
    const total = Math.ceil(lineCount * lineHeight + gap * Math.max(0, blocks.length - 1));

    // Sharp on high-density screens
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(total * ratio);
    canvas.style.height = `${total}px`;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, total);
    ctx.font = font;
    ctx.fillStyle = style.color;
    ctx.textBaseline = 'middle';

    let y = 0;
    blocks.forEach((lines) => {
      lines.forEach((line) => {
        ctx.fillText(line, 0, y + lineHeight / 2);
        y += lineHeight;
      });
      y += gap;
    });
  }, [paragraphs]);

  useEffect(() => {
    draw();
    const box = boxRef.current;
    // Only a new width needs new line breaks (the height follows from them)
    let lastWidth = box.clientWidth;
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            if (box.clientWidth === lastWidth) return;
            lastWidth = box.clientWidth;
            draw();
          });
    observer?.observe(box);
    // Page zoom changes the pixel ratio
    window.addEventListener('resize', draw);
    // Redraw once the web fonts are in, so the canvas does not keep a fallback font
    const fonts = document.fonts;
    fonts?.ready?.then(draw);
    fonts?.addEventListener?.('loadingdone', draw);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', draw);
      fonts?.removeEventListener?.('loadingdone', draw);
    };
  }, [draw]);

  return (
    <div
      ref={boxRef}
      className={cn('select-none', className)}
      style={{ WebkitTouchCallout: 'none' }}
      onCopy={prevent}
      onCut={prevent}
      onContextMenu={prevent}
      onDragStart={prevent}
    >
      <canvas ref={canvasRef} role="img" aria-label={label} className="block w-full" />
    </div>
  );
}
