import { CHIPPRAGI } from "../index.js";

CHIPPRAGI.registerComponent('WeatherComponent', {
  schema: {
    locationName: { type: 'string', default: '' },
    weatherDescription: { type: 'string', default: '' },
    temperature: { type: 'number', default: null },
  },
});
