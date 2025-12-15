/* eslint-disable */
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';

export const displayMap = locations => {
  maptilersdk.config.apiKey = '3HeEjtcTFMSrKgwYIeuQ';

  const map = new maptilersdk.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/landscape-v4/style.json',
    scrollZoom: false,
    interactive: false
  });

  const bounds = new maptilersdk.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new maptilersdk.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates) // [lng, lat]
      .addTo(map);

    // Add popup
    new maptilersdk.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend bounds
    bounds.extend(loc.coordinates);
  });

  map.on('load', () => {
    map.fitBounds(bounds, {
      padding: {
        top: 200,
        bottom: 150,
        left: 100,
        right: 100
      }
    });
  });
};
