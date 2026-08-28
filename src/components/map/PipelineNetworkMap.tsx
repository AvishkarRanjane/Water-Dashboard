/**
 * AquaWatch - Pipeline Network GIS Map
 * Multi-layer pipeline infrastructure visualization: Material, Installation Year,
 * Pressure Zones (DMAs), IoT Sensors, and Active Leak Hotspots.
 */

import React from 'react';
import { MapComponent, MapComponentProps } from './MapComponent';

export const PipelineNetworkMap: React.FC<MapComponentProps> = (props) => {
  return <MapComponent {...props} />;
};

export default PipelineNetworkMap;
