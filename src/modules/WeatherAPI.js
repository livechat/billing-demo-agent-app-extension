import Config from "../Config";

class WeatherAPI {
  fetchWeather(latitude, longitude) {
    return new Promise((resolve, reject) => {
      window
        .fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${
            Config.weather_api_key
          }&units=metric`
        )
        .then(response => {
          if (response.status !== 200) {
            throw new Error(`Error: openweathermap.org API not responding`);
          }
          return response.json();
        })
        .then(response => resolve(response))
        .catch(error => reject(error));
    });
  }
}

export default new WeatherAPI();
