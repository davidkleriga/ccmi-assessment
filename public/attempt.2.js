
import React from 'react';
import ReactDom from 'react-dom';
import { Map, TileLayer, Marker, Popup, Circle, FeatureGroup, LayerGroup, LayersControl, Rectangle } from 'react-leaflet';

const { BaseLayer, Overlay } = LayersControl;

export default class SimpleMapComponent extends React.Component {
  constructor() {
    super();
    this.state = {
      lat: 51.505,
      lng: -0.09,
      zoom: 13,
    };
  }

  get position() {
    const { lat, lng } = this.state;
    return [lat, lng];
  }

  render() {
    console.log('rendering', this);
    // const center = this.position;

    const center = [51.505, -0.09];
    const rectangle = [[51.49, -0.08], [51.5, -0.06]];
    return (
      <Map center={center} zoom={this.state.zoom}>


        <LayersControl position="topright">
          <BaseLayer checked name="OpenStreetMap.Mapnik">
            <TileLayer
              attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>
          <BaseLayer name="OpenStreetMap.BlackAndWhite">
            <TileLayer
              attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
              url="https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png"
            />
          </BaseLayer>
        </LayersControl>

      </Map>
    );
  }
}

const container = document.getElementById('leaflet-container');
ReactDom.render(<SimpleMapComponent />, container);
