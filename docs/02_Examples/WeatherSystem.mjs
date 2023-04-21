import { CHIPPRAGI } from "../index.js";
import axios from 'axios';

CHIPPRAGI.registerSystem('WeatherCheckSystem', {
    info: {
        version : "0.1.0",
        license : "APACHE_2",
        developer: "Chippr",
        description : "This system makes an external call to get the weather and updates one or all entities",
      },
    
    init: function (_eventEmitter) {
        _eventEmitter.on('checkWeather', (data) => {
          this.handleCheckWeather(data);
        });
        _eventEmitter.on('updateAllWeatherComponents', (data) => {
            this.updateAllWeatherComponents(data);
          });
    },

    handleCheckWeather: async function (entityId, zipCode) {
        const apiKey = process.env.OPENWEATHERMAP_API_KEY;
        const url = `http://api.openweathermap.org/data/2.5/weather?zip=${zipCode}&appid=${apiKey}&units=imperial`;

        try {
            const response = await axios.get(url);
            const weatherData = response.data;

        // Update the WeatherComponent of the specified entity
            CHIPPRAGI.updateComponent(entityId, 'WeatherComponent', {
                locationName: weatherData.name,
                weatherDescription: weatherData.weather[0].description,
                temperature: weatherData.main.temp,
            });
        } catch (error) {
            console.error('Error fetching weather data:', error);
        }
    },
  
    updateAllWeatherComponents: async function () {
        // Get all entities with a WeatherComponent
        const entitiesWithWeather = CHIPPRAGI.queryEntities({ hasComponent: 'WeatherComponent' }); // need list function in the vectordb

        // Update the weather data for each entity
        for (const entityId of entitiesWithWeather) {
            const entity = CHIPPRAGI.getComponent(entityId, 'WeatherComponent');
            const weatherComponent = entity.WeatherComponent;

        if (weatherComponent && weatherComponent.zipCode) {
            await this.handleCheckWeather(entityId, weatherComponent.zipCode);
        }
        }
    },
});
