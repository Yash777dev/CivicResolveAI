import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default leaflet marker icon asset resolution
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ComplaintMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  isInteractive?: boolean;
  title?: string;
  className?: string;
}

export const ComplaintMap: React.FC<ComplaintMapProps> = ({
  initialLat = 13.0827, // Default Chennai, Tamil Nadu coordinates
  initialLng = 80.2707,
  onLocationSelect,
  isInteractive = false,
  title,
  className = 'h-64 w-full rounded-md border border-slate-300',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);
    mapInstanceRef.current = map;

    // OpenStreetMap standard tiles with obligatory copyright attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Initial marker
    const marker = L.marker([initialLat, initialLng]).addTo(map);
    if (title) {
      marker.bindPopup(`<b>${title}</b>`).openPopup();
    }
    markerRef.current = marker;

    if (isInteractive) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        marker.bindPopup(`Selected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`).openPopup();
        if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (markerRef.current && (initialLat !== undefined && initialLng !== undefined)) {
      markerRef.current.setLatLng([initialLat, initialLng]);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([initialLat, initialLng]);
      }
    }
  }, [initialLat, initialLng]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className={className} />
      {isInteractive && (
        <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded shadow-xs text-[11px] font-medium text-slate-700 border border-slate-200">
          Click map to position pin
        </div>
      )}
    </div>
  );
};
