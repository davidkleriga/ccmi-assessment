const { L, shp } = window || global;

const { uniq, object } = require('underscore');

const DEFAULT_MAP_ID = 'leaflet-container';
const DEFAULT_ZOOM_LEVEL = 9;
const DEFAULT_LOCATION = { Latitude: '', Longitude: '' };

const COLOR_PALETTE = [
  'blue',
  'red',
  'purple',
  'orange',
  'yellow',
  'green',
  'brown',
  'black',
];

const maineGeocodingURL =
  'https://geoservices.tamu.edu/Services/Geocode/WebService/GeocoderWebServiceHttpNonParsed_V04_01.aspx?state=me&apikey=demo&format=json&version=4.01';

const loadInteractiveBuildings = (map) => {
  shp('lit_buildings/maine').then((geoJSON) => {
    L.geoJSON(geoJSON, {
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          const keys = Object.keys(feature.properties);
          const popupMessage = keys
            .map(key => `${key}: ${feature.properties[key]}`)
            .join('<br />');
          layer.bindPopup(popupMessage);
        }
      },
    }).addTo(map);
  });
};

const createMapIn = (
  geocodeData,
  mapId = DEFAULT_MAP_ID,
  zoomLevel = DEFAULT_ZOOM_LEVEL,
) =>
  L.map(mapId).setView(
    [geocodeData.Latitude, geocodeData.Longitude],
    zoomLevel,
  );

const addLegend = (map, labelMap) => {
  const legend = L.control({ position: 'topright' });
  const extractColorLabels = key =>
    `<div class="color-label" style="background-color: ${
      labelMap[key]
    };"></div><label>${key || '(unassigned)'}</label>`;
  legend.onAdd = () => {
    const container = L.DomUtil.create('div', 'info legend');
    container.innerHTML = '<h2>Fiber Cables by owner</h2>';
    container.innerHTML += Object.keys(labelMap)
      .map(extractColorLabels)
      .join('<br />');
    return container;
  };
  legend.addTo(map);
};

const addBuildingToggleButton = (map) => {
  const legend = L.control({ position: 'topright' });
  const button = document.createElement('button');
  button.innerText = 'toggle buildings on/off (impacts performance)';
  button.addEventListener('click', loadInteractiveBuildings.bind(null, map));
  legend.onAdd = () => button;
  legend.addTo(map);
};

const addFiberCables = (map) => {
  shp('fiber_cables/maine').then((geoJSON) => {
    console.log('geojson loaded', { geoJSON });
    const colorRange = uniq(
      geoJSON.features,
      item => item.properties.OWNER,
    ).map((item, index) => [item.properties.OWNER, COLOR_PALETTE[index]]);
    const colorRangeMap = object(colorRange);
    console.log({ colorRange, colorRangeMap });
    L.geoJSON(geoJSON, {
      style(feature) {
        return {
          color: colorRangeMap[feature.properties.OWNER],
          //   color: 'black',
        };
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          layer.bindPopup(feature.properties.OWNER);
        }
      },
    }).addTo(map);
    addLegend(map, colorRangeMap);
  });
};

const hydrateMap = (map) => {
  // map.touchZoom.disable();
  // map.doubleClickZoom.disable();
  // map.scrollWheelZoom.disable();

  L.tileLayer(
    'https://api.mapbox.com/styles/v1/dkleriga/cjgq9bskq00002rpz3u4gls00/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZGtsZXJpZ2EiLCJhIjoiY2pncTZ2bnE4MHMzbDMxbGs1NnVlYjZxcyJ9.hrV1axpLQZDnU0B8UfWsCQ',
    {
      attribution:
        '&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors',
    },
  ).addTo(map);
  addBuildingToggleButton(map);
  addFiberCables(map);
};

const determineGeocodeLocation = new Promise((resolve) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', maineGeocodingURL);
  xhr.send(null);
  xhr.onreadystatechange = () => {
    const DONE = 4;
    const OK = 200;
    const requestSucceeded = xhr.readyState === DONE && xhr.status === OK;
    if (requestSucceeded) {
      const geocodeResponse = JSON.parse(xhr.responseText);
      const geocodeObjects = geocodeResponse.OutputGeocodes;
      const isGeocodeDataValid = geocodeObjects && geocodeObjects.length > 0;
      console.log({ isGeocodeDataValid });
      return isGeocodeDataValid
        ? resolve(geocodeObjects[0].OutputGeocode)
        : resolve(DEFAULT_LOCATION);
    }
  };
});

determineGeocodeLocation.then(createMapIn).then(hydrateMap);
