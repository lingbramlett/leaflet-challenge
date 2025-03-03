
// Create the 'basemap' tile layer that will be the background of our map.
let basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
});

// OPTIONAL: Step 2 - Create the 'street' tile layer as a second background of the map
let streetMap = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors, Humanitarian OpenStreetMap Team'
});

// Create the map object with center and zoom options.
let map = L.map("map", {
    center: [20, 0], // Centered roughly at the equator
    zoom: 2,
    layers: [basemap] // Default layer
});

// Then add the 'basemap' tile layer to the map.
basemap.addTo(map);

// OPTIONAL: Step 2 - Create layer groups for earthquakes and tectonic plates.
let earthquakeLayer = L.layerGroup();
let tectonicPlatesLayer = L.layerGroup();

// Base maps for switching views
let baseMaps = {
    "Standard Map": basemap,
    "Street Map": streetMap
};

// Overlay maps
let overlayMaps = {
    "Earthquakes": earthquakeLayer,
    "Tectonic Plates": tectonicPlatesLayer
};

// Add layer control to switch between layers
L.control.layers(baseMaps, overlayMaps).addTo(map);

// Fetch earthquake geoJSON data
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function (data) {

    // Function to define marker style
    function styleInfo(feature) {
        return {
            opacity: 1,
            fillOpacity: 0.8,
            fillColor: getColor(feature.geometry.coordinates[2]), // Depth-based color
            color: "#000",
            radius: getRadius(feature.properties.mag), // Magnitude-based radius
            stroke: true,
            weight: 0.5
        };
    }

    // Function to determine marker color based on earthquake depth
    function getColor(depth) {
        return depth > 90 ? "#ea2c2c" :
               depth > 70 ? "#ea822c" :
               depth > 50 ? "#ee9c00" :
               depth > 30 ? "#eecc00" :
               depth > 10 ? "#d4ee00" :
                            "#98ee00";
    }

    // Function to determine marker radius based on magnitude
    function getRadius(magnitude) {
        return magnitude === 0 ? 1 : magnitude * 4;
    }

    // Add GeoJSON layer to map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng);
        },
        style: styleInfo,
        onEachFeature: function (feature, layer) {
            layer.bindPopup(
                `<h3>Location: ${feature.properties.place}</h3>
                 <p>Magnitude: ${feature.properties.mag}</p>
                 <p>Depth: ${feature.geometry.coordinates[2]} km</p>
                 <p>Date: ${new Date(feature.properties.time)}</p>`
            );
        }
    }).addTo(earthquakeLayer);

    // Add earthquake layer to the map
    earthquakeLayer.addTo(map);

    // Create and add legend
    let legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
        let div = L.DomUtil.create("div", "info legend");
        let depths = [-10, 10, 30, 50, 70, 90];
        let colors = ["#98ee00", "#d4ee00", "#eecc00", "#ee9c00", "#ea822c", "#ea2c2c"];
        
        div.innerHTML += "<strong>Depth (km)</strong><br>";
        
        for (let i = 0; i < depths.length; i++) {
            div.innerHTML += `<i style="background: ${colors[i]}"></i> ${depths[i]}${depths[i + 1] ? "&ndash;" + depths[i + 1] : "+"}<br>`;
        }
        return div;
    };
    legend.addTo(map);

    // OPTIONAL: Step 2 - Fetch tectonic plates geoJSON data
    d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function (plate_data) {
        L.geoJson(plate_data, {
            color: "orange",
            weight: 2
        }).addTo(tectonicPlatesLayer);
        tectonicPlatesLayer.addTo(map);
    });
});
