const { L, shp, d3 } = window || global;

const { uniq, object } = require('underscore');

const DEFAULT_MAP_ID = 'leaflet-container';
const DEFAULT_ZOOM_LEVEL = 8.2;
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

function setupD3(map, geoJSON) {
  function projectPoint(x, y) {
    const point = map.latLngToLayerPoint(L.latLng(y, x));
    this.stream.point(point.x, point.y);
  }
  const svg = d3.select(map.getPanes().overlayPane).append('svg');
  const g = svg.append('g');
  const transform = d3.geo.transform({ point: projectPoint });
  const path = d3.geo.path().projection(transform);

  const feature = g
    .selectAll('path')
    .data(geoJSON.features)
    .enter()
    .append('path')
    .attr('d', path);

  const onReset = () => {
    const [topLeft, bottomRight] = path.bounds(geoJSON);
    console.log({ topLeft, bottomRight });
    const scale = map.getSize().x / (bottomRight[0] - topLeft[0]);
    console.log(scale);
    svg
      .attr('width', (bottomRight[0] - topLeft[0]) * scale)
      .attr('height', (bottomRight[1] - topLeft[1]) * scale)
      .style('left', `${topLeft[0]}px`)
      .style('top', `${topLeft[1]}px`);
    console.log({ svg, map });
    g.attr('transform', `translate(${-topLeft[0]}, ${-topLeft[1]})`);
    console.log({ g });

    // feature.attr('d', path);
    console.log({ feature, path });
  };

  map.on('viewReset', onReset);
  onReset();
}

const createMapIn = (
  geocodeData,
  mapId = DEFAULT_MAP_ID,
  zoomLevel = DEFAULT_ZOOM_LEVEL,
) =>
  L.map(mapId).setView(
    [geocodeData.Latitude, geocodeData.Longitude],
    zoomLevel,
  );

const hydrateMap = (map) => {
  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors',
    maxZoom: 14,
  }).addTo(map);

  //   shp('fiber_cables/maine').then((geoJSON) => {
  shp('lit_buildings/maine').then((geoJSON) => {
    setupD3(map, geoJSON);
    // L.geoJSON(geoJSON, {
    //   onEachFeature: (feature, layer) => {},
    // }).addTo(map);
  });

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
  });
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
