import React, { useEffect, useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface LocationMapProps {
  providerName: string;
  address: string;
  districtName: string;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  providerName,
  address,
  districtName
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Map latitude/longitude approximations for J&K districts
  const districtCoords: Record<string, { lat: number; lon: number }> = {
    'Srinagar': { lat: 34.0837, lon: 74.7973 },
    'Baramulla': { lat: 34.2018, lon: 74.3436 },
    'Anantnag': { lat: 33.7311, lon: 75.1487 },
    'Budgam': { lat: 34.0150, lon: 74.7200 },
    'Pulwama': { lat: 33.8717, lon: 74.8984 },
    'Kupwara': { lat: 34.5312, lon: 74.2546 },
    'Jammu': { lat: 32.7266, lon: 74.8570 },
  };

  const coords = districtCoords[districtName] || { lat: 34.0837, lon: 74.7973 };

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([coords.lat, coords.lon], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Custom teal pin icon
      const tealIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background-color: #0d9488; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); border: 2px solid white;">
                 <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
               </div>`,
        iconSize: [32, 32],
        iconPoint: [16, 32]
      });

      L.marker([coords.lat, coords.lon], { icon: tealIcon })
        .addTo(map)
        .bindPopup(`<b>${providerName}</b><br/>${address}`)
        .openPopup();

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([coords.lat, coords.lon], 15);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coords.lat, coords.lon, providerName, address]);

  return (
    <div className="relative w-full h-full bg-slate-100 flex flex-col justify-between">
      <div ref={mapRef} className="w-full h-full z-10" />
      
      {/* Floating Info Pill */}
      <div className="absolute bottom-3 left-3 right-3 z-20 bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200/80 shadow-md flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 truncate">
          <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="font-bold text-slate-900 truncate">{providerName}</p>
            <p className="text-[10px] text-slate-500 truncate">{address}</p>
          </div>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded-lg bg-teal-700 text-white font-semibold text-[11px] shrink-0 hover:bg-teal-800 transition-colors flex items-center gap-1 shadow-sm"
        >
          <Navigation className="w-3 h-3 text-teal-200" />
          <span>Directions</span>
        </a>
      </div>
    </div>
  );
};
