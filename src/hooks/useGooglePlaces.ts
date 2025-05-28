// src/hooks/useGooglePlaces.ts
"use client";

import { useEffect, useState } from "react";

export function useGooglePlaces() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.google && !document.getElementById("google-maps")) {
      const script = document.createElement("script");
      script.id = "google-maps";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}&libraries=places`;
      script.async = true;
      script.onload = () => setLoaded(true);
      document.head.appendChild(script);
    } else {
      setLoaded(true);
    }
  }, []);

  const attachAutocomplete = (inputRef: HTMLInputElement | null, onPlaceSelected: (address: string) => void) => {
    if (!window.google || !inputRef) return;
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef);
    autocomplete.setFields(["formatted_address"]);
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        onPlaceSelected(place.formatted_address);
      }
    });
  };

  return { loaded, attachAutocomplete };
}
