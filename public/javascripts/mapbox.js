const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);

mapboxgl.accessToken =
    'pk.eyJ1IjoiZW5lYnJhIiwiYSI6ImNrOGliY2l1OTAxMjMzZnJ6NWRpZXBjbTUifQ.hwW5mTQ3x8Rg318RPyn-lQ';
let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/enebra/ck8idyyyl2ano1inyfc70a6hn',
    // style: 'mapbox://styles/enebra/ck8idubas2a921inyjt251vq9',
    scrollZoom: false
    //// All options see: https://docs.mapbox.com/mapbox-gl-js/api/
    // center: [-116.214531, 51.417611],
    // zoom: '10',
    // interactive: false
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
        element: el,
        anchor: 'bottom',
    })
        .setLngLat(loc.coordinates)
        .addTo(map);

    // Add to Popup
    new mapboxgl.Popup({
        offset: 30
    })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
        .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
    padding: {
        top: 200,
        bottom: 150,
        left: 100,
        right: 100,
    },
});
