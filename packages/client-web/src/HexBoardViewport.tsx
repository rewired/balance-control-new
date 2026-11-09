import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react';

interface Point { x: number; y: number }
interface Camera extends Point { zoom: number }

const minZoom = 50;
const maxZoom = 200;
const boardCenter = { x: 0, y: 0 };

function zoomCamera(camera: Camera, amount: number, anchor = boardCenter): Camera {
  const zoom = Math.min(maxZoom, Math.max(minZoom, camera.zoom + amount));
  if (zoom === camera.zoom) return camera;
  const ratio = zoom / camera.zoom;
  return {
    zoom,
    x: anchor.x + (camera.x - anchor.x) * ratio,
    y: anchor.y + (camera.y - anchor.y) * ratio,
  };
}

export default function HexBoardViewport({ tileCount, width, height, origin, center, children }: {
  tileCount: number;
  width: number;
  height: number;
  origin: Point;
  center: Point;
  children: ReactNode;
}) {
  const [camera, setCamera] = useState<Camera>({ ...boardCenter, zoom: 100 });
  const [dragging, setDragging] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<(Point & { id: number; moved: boolean }) | null>(null);
  const suppressClick = useRef(false);
  const hint = useId();

  useEffect(() => {
    const board = viewport.current;
    if (!board) return;
    const wheel = (event: WheelEvent) => {
      if (!event.deltaY || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const rect = board.getBoundingClientRect();
      const anchor = { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 };
      setCamera(current => zoomCamera(current, -Math.sign(event.deltaY) * 10, anchor));
    };
    board.addEventListener('wheel', wheel, { passive: false });
    return () => board.removeEventListener('wheel', wheel);
  }, []);

  const pan = (x: number, y: number) => setCamera(current => ({ ...current, x: current.x + x, y: current.y + y }));

  const movePointer = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = drag.current;
    if (pointer?.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (!pointer.moved) {
      if (Math.hypot(dx, dy) < 5) return;
      pointer.moved = true;
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pan(dx, dy);
  };

  const endPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
  };

  const scale = camera.zoom / 100;
  return <>
    <header className="core-board-heading">
      <div><p className="core-kicker">Match overview</p><h3>Board</h3></div>
      <span className="core-tile-total">{tileCount} {tileCount === 1 ? 'tile' : 'tiles'}</span>
      <div className="board-tools" role="group" aria-label="Board controls">
        <span className="board-gesture-hint" id={hint}>Wheel to zoom · Drag to pan</span>
        <button type="button" aria-label="Zoom out" disabled={camera.zoom <= minZoom}
          onClick={() => setCamera(current => zoomCamera(current, -25))}>−</button>
        <output aria-label="Board zoom">{camera.zoom}%</output>
        <button type="button" aria-label="Zoom in" disabled={camera.zoom >= maxZoom}
          onClick={() => setCamera(current => zoomCamera(current, 25))}>+</button>
        <button type="button" onClick={() => setCamera(current => ({ ...current,
          x: -center.x * current.zoom / 100, y: -center.y * current.zoom / 100,
        }))}>Center</button>
      </div>
    </header>
    <div className="hex-board" ref={viewport} data-dragging={dragging} tabIndex={0} role="region" aria-label="Hex field"
      aria-describedby={hint} aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        suppressClick.current = false;
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
      }}
      onPointerMove={movePointer}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onLostPointerCapture={endPointer}
      onPointerLeave={event => { if (!drag.current?.moved) endPointer(event); }}
      onClickCapture={event => {
        if (!suppressClick.current || event.detail === 0) return;
        suppressClick.current = false;
        event.stopPropagation();
        event.preventDefault();
      }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        const step = 60;
        const direction: Record<string, Point> = {
          ArrowLeft: { x: step, y: 0 }, ArrowRight: { x: -step, y: 0 },
          ArrowUp: { x: 0, y: step }, ArrowDown: { x: 0, y: -step },
        };
        const offset = direction[event.key];
        if (!offset) return;
        event.preventDefault();
        pan(offset.x, offset.y);
      }}
      onFocus={event => {
        if (!event.target.matches('.hex-cell:focus-visible')) return;
        const tile = event.target.getBoundingClientRect();
        const board = event.currentTarget.getBoundingClientRect();
        if (tile.left < board.left || tile.right > board.right || tile.top < board.top || tile.bottom > board.bottom) {
          pan((board.left + board.right - tile.left - tile.right) / 2,
            (board.top + board.bottom - tile.top - tile.bottom) / 2);
        }
      }}>
      <div className="hex-field" style={{ width, height,
        transform: `translate(${camera.x}px, ${camera.y}px) scale(${scale}) translate(${origin.x}px, ${origin.y}px)`,
      }}>{children}</div>
    </div>
  </>;
}
