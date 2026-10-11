"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMap } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

type AppearanceGoogleMarkerProps = {
  position: google.maps.LatLngLiteral;
  children?: ReactNode;
  zIndex?: number;
  draggable?: boolean;
  onDragEnd?: (position: google.maps.LatLngLiteral) => void;
};

/** DOM pins for locally styled raster maps, preserving React buttons without a cloud map ID. */
export function AppearanceGoogleMarker({ position, children, zIndex = 0, draggable = false, onDragEnd }: AppearanceGoogleMarkerProps) {
  const map = useMap();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const callback = useRef(onDragEnd);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef(position);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const { lat, lng } = position;

  useEffect(() => { callback.current = onDragEnd; }, [onDragEnd]);
  useEffect(() => {
    positionRef.current = { lat, lng };
    overlayRef.current?.draw();
  }, [lat, lng]);

  useEffect(() => {
    if (!map) return;
    const overlay = new google.maps.OverlayView();
    const node = document.createElement("div");
    nodeRef.current = node;
    node.style.position = "absolute";
    node.style.transform = "translate(-50%, -100%)";
    node.style.touchAction = draggable ? "none" : "auto";
    node.style.cursor = draggable ? "grab" : "auto";
    let drag: { id: number; x: number; y: number; pixel: google.maps.Point } | null = null;

    overlay.onAdd = () => {
      overlay.getPanes()?.overlayMouseTarget.appendChild(node);
      google.maps.OverlayView.preventMapHitsAndGesturesFrom(node);
      setContainer(node);
    };
    overlay.draw = () => {
      if (drag) return;
      const pixel = overlay.getProjection()?.fromLatLngToDivPixel(new google.maps.LatLng(positionRef.current));
      if (pixel) { node.style.left = `${pixel.x}px`; node.style.top = `${pixel.y}px`; }
    };
    overlay.onRemove = () => { node.remove(); setContainer(null); };

    const pointerDown = (event: PointerEvent) => {
      if (!draggable || event.button !== 0) return;
      const pixel = overlay.getProjection()?.fromLatLngToDivPixel(new google.maps.LatLng(positionRef.current));
      if (!pixel) return;
      event.preventDefault();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, pixel };
      node.setPointerCapture(event.pointerId);
      node.style.cursor = "grabbing";
    };
    const pointerMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      node.style.left = `${drag.pixel.x + event.clientX - drag.x}px`;
      node.style.top = `${drag.pixel.y + event.clientY - drag.y}px`;
    };
    const pointerUp = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      const point = overlay.getProjection().fromDivPixelToLatLng(new google.maps.Point(drag.pixel.x + event.clientX - drag.x, drag.pixel.y + event.clientY - drag.y));
      drag = null;
      node.style.cursor = "grab";
      if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
      if (point) callback.current?.(point.toJSON());
    };
    const cancel = () => { drag = null; node.style.cursor = draggable ? "grab" : "auto"; overlay.draw(); };
    node.addEventListener("pointerdown", pointerDown);
    node.addEventListener("pointermove", pointerMove);
    node.addEventListener("pointerup", pointerUp);
    node.addEventListener("pointercancel", cancel);
    overlayRef.current = overlay;
    overlay.setMap(map);
    return () => {
      node.removeEventListener("pointerdown", pointerDown);
      node.removeEventListener("pointermove", pointerMove);
      node.removeEventListener("pointerup", pointerUp);
      node.removeEventListener("pointercancel", cancel);
      overlay.setMap(null);
      overlayRef.current = null;
      nodeRef.current = null;
    };
  }, [map, draggable]);

  useEffect(() => { if (nodeRef.current) nodeRef.current.style.zIndex = String(zIndex); }, [container, zIndex]);

  if (!container) return null;
  return createPortal(children ?? (
    <button type="button" aria-label={draggable ? "Move location pin" : "Location pin"} title={draggable ? "Drag the pin or use arrow keys to move it" : undefined}
      className="rounded-sm text-map-pin focus-visible:outline-2 focus-visible:outline-ring"
      onKeyDown={(event) => {
        if (!draggable) return;
        const offset = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[event.key];
        const projection = overlayRef.current?.getProjection();
        if (!offset || !projection) return;
        event.preventDefault();
        const pixel = projection.fromLatLngToDivPixel(new google.maps.LatLng(lat, lng));
        if (!pixel) return;
        const point = projection.fromDivPixelToLatLng(new google.maps.Point(pixel.x + offset[0], pixel.y + offset[1]));
        if (point) callback.current?.(point.toJSON());
      }}>
      <MapPin className="size-9 fill-map-pin stroke-map-pin-foreground" aria-hidden="true" />
    </button>
  ), container);
}
