/**
 * @fileoverview 天气模块 - 处理天气数据获取和位置管理
 * @module weather
 * @description 提供实时天气、7天预报、穿衣指数计算、天气预警检测、GPS定位等功能
 * @author Smart Outfit Team
 * @version 2.0
 */

class WeatherManager {
    constructor() {
        this.currentWeather = null;
        this.currentLocation = null;
    }

    getWeatherDesc(code) {
        return CONFIG.weatherCodes[code] || '多云';
    }

    getCityCoords(cityName) {
        if (CITY_COORDS[cityName]) {
            return CITY_COORDS[cityName];
        }
        const cleanName = cityName.replace(/市$/, '');
        if (CITY_COORDS[cleanName]) {
            return CITY_COORDS[cleanName];
        }
        return null;
    }

    async getWeather(cityName) {
        const coords = this.getCityCoords(cityName);
        if (!coords) {
            return { success: false, error: `暂不支持城市: ${cityName}` };
        }
        try {
            const [currentData, forecastData] = await Promise.all([
                api.getWeather(coords[0], coords[1]),
                api.getWeatherForecast(coords[0], coords[1])
            ]);
            this.currentWeather = {
                temp: Math.round(currentData.current.temperature_2m),
                code: currentData.current.weather_code,
                desc: this.getWeatherDesc(currentData.current.weather_code),
                windSpeed: currentData.current.wind_speed_10m,
                time: new Date()
            };
            return { success: true, data: this.currentWeather };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    calculateClothingIndex(weather) {
        const temp = weather.temp;
        let index = 5, suggestion = '舒适', level = '适中';
        if (temp >= 30) { index = 1; suggestion = '极热，建议穿短袖短裤'; level = '炎热'; }
        else if (temp >= 25) { index = 2; suggestion = '热，建议穿短袖'; level = '偏热'; }
        else if (temp >= 20) { index = 3; suggestion = '温暖，建议穿长袖'; level = '舒适'; }
        else if (temp >= 15) { index = 4; suggestion = '凉爽，建议穿薄外套'; level = '偏凉'; }
        else if (temp >= 10) { index = 5; suggestion = '凉，建议穿毛衣'; level = '凉'; }
        else if (temp >= 5) { index = 6; suggestion = '冷，建议穿厚外套'; level = '偏冷'; }
        else if (temp >= 0) { index = 7; suggestion = '寒冷，建议穿羽绒服'; level = '冷'; }
        else { index = 8; suggestion = '极寒，建议穿厚羽绒服'; level = '严寒'; }
        return { index, level, suggestion, temp };
    }

    getCurrentWeather() {
        return this.currentWeather;
    }

    async getGPSLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('浏览器不支持定位'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                (err) => reject(new Error('定位失败')),
                { timeout: 10000 }
            );
        });
    }

    getCityList() {
        return Object.keys(CITY_COORDS).sort();
    }
}

const weather = new WeatherManager();
