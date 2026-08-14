import fs from 'fs';
let code = fs.readFileSync('src/components/PatientHome.tsx', 'utf8');

const importRegex = /import React, { useState, useEffect, useMemo, useRef } from 'react';/;
if (!importRegex.test(code)) {
    code = code.replace(/import React, { useState, useEffect, useMemo, useRef } from 'react';/, "import React, { useState, useEffect, useMemo, useRef } from 'react';");
}

code = code.replace(
  `  const [customLocationInput, setCustomLocationInput] = useState('');`,
  `  const [customLocationInput, setCustomLocationInput] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleDetectLocation = async () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      // Use OSM Nominatim for reverse geocoding as fallback if API key is not present
      const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${pos.coords.latitude}&lon=\${pos.coords.longitude}\`);
      const data = await res.json();
      if (data && data.address) {
        const district = data.address.county || data.address.state_district || data.address.city;
        if (district) {
          setSelectedDistrictFilter(district);
          setIsLocationPickerOpen(false);
        } else {
          alert('Could not determine district from your location.');
        }
      }
    } catch (err) {
      alert('Failed to detect location. Please check your permissions.');
    } finally {
      setIsLocating(false);
    }
  };`
);

code = code.replace(
  `            {/* Custom Location Search */}`,
  `            <button 
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="w-full bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-2xl py-3 px-4 mb-6 flex items-center justify-center gap-2 font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <MapPin className="w-5 h-5" />
              {isLocating ? 'Detecting your location...' : 'Use my Current Location'}
            </button>
            {/* Custom Location Search */}`
);

fs.writeFileSync('src/components/PatientHome.tsx', code);
