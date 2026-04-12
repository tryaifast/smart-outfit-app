/**
 * @fileoverview 天气模块 - 处理天气数据获取和位置管理
 * @module weather
 * @description 提供实时天气、7天预报、穿衣指数计算、天气预警检测、GPS定位等功能
 * @author Smart Outfit Team
 * @version 2.0
 */

/**
 * 天气管理类
 * @class WeatherManager
 * @description 处理天气数据获取和位置管理
 * @property {object} currentWeather - 当前天气数据
 * @property {string} currentLocation - 当前位置
 */

class WeatherManager {
    constructor() {
        this.currentWeather = null;
        this.currentLocation = null;
    }

    /**
     * 获取天气描述
     * @param {number} code - WMO 天气代码
     * @returns {string}
     */
    getWeatherDesc(code) {
        return CONFIG.weatherCodes[code] || '多云';
    }

    /**
     * 获取城市坐标
     * @param {string} cityName 
     * @returns {array|null} [lat, lon]
     */
    getCityCoords(cityName) {
        // 直接匹配
        if (CITY_COORDS[cityName]) {
            return CITY_COORDS[cityName];
        }
        
        // 模糊匹配（去掉"市"后缀）
        const cleanName = cityName.replace(/市$/, '');
        if (CITY_COORDS[cleanName]) {
            return CITY_COORDS[cleanName];
        }

        return null;
    }

    /**
     * 获取天气数据（含预报）
     * @param {string} cityName 
     * @returns {object} { success: boolean, data?: object, error?: string }
     */
    async getWeather(cityName) {
        const coords = this.getCityCoords(cityName);
        if (!coords) {
            return { 
                success: false, 
                error: `暂不支持城市: ${cityName}，请选择列表中的城市` 
            };
        }

        try {
            // 获取当前天气 + 7天预报
            const [currentData, forecastData] = await Promise.all([
                api.getWeather(coords[0], coords[1]),
                api.getWeatherForecast(coords[0], coords[1])
            ]);
            
            this.currentWeather = {
                temp: Math.round(currentData.current.temperature_2m),
                code: currentData.current.weather_code,
                desc: this.getWeatherDesc(currentData.current.weather_code),
                windSpeed: currentData.current.wind_speed_10m,
                humidity: currentData.current.relative_humidity_2m,
                pressure: currentData.current.surface_pressure,
                time: new Date(),
                // 7天预报
                forecast: forecastData.daily ? {
                    dates: forecastData.daily.time,
                    maxTemps: forecastData.daily.temperature_2m_max,
                    minTemps: forecastData.daily.temperature_2m_min,
                    weatherCodes: forecastData.daily.weather_code,
                    precipitation: forecastData.daily.precipitation_sum
                } : null
            };
            
            // 计算穿衣指数
            this.currentWeather.clothingIndex = this.calculateClothingIndex(this.currentWeather);
            
            return { success: true, data: this.currentWeather };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 计算穿衣指数
     * @param {object} weather 
     * @returns {object}
     */
    calculateClothingIndex(weather) {
        const temp = weather.temp;
        const code = weather.code;
        const wind = weather.windSpeed || 0;
        
        // 基础指数
        let index = 5; // 适中
        let suggestion = '舒适';
        let level = '适中';
        
        // 温度影响
        if (temp >= 30) {
            index = 1;
            suggestion = '极热，建议穿短袖、短裤、凉鞋';
            level = '炎热';
        } else if (temp >= 25) {
            index = 2;
            suggestion = '热，建议穿短袖、薄长裤';
            level = '偏热';
        } else if (temp >= 20) {
            index = 3;
            suggestion = '温暖，建议穿长袖T恤、薄外套';
            level = '舒适';
        } else if (temp >= 15) {
            index = 4;
            suggestion = '凉爽，建议穿薄毛衣、外套';
            level = '偏凉';
        } else if (temp >= 10) {
            index = 5;
            suggestion = '凉，建议穿毛衣、厚外套';
            level = '凉';
        } else if (temp >= 5) {
            index = 6;
            suggestion = '冷，建议穿厚毛衣、羽绒服';
            level = '偏冷';
        } else if (temp >= 0) {
            index = 7;
            suggestion = '寒冷，建议穿羽绒服、保暖内衣';
            level = '冷';
        } else {
            index = 8;
            suggestion = '极寒，建议穿厚羽绒服、保暖内衣、围巾手套';
            level = '严寒';
        }
        
        // 天气修正
        const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
        const snowCodes = [71, 73, 75, 77, 85, 86];
        
        if (rainCodes.includes(code)) {
            suggestion += '，记得带伞';
            index += 0.5;
        } else if (snowCodes.includes(code)) {
            suggestion += '，注意防滑';
            index += 1;
        }
        
        // 风力修正
        if (wind >= 20) {
            suggestion += '，风大注意防风';
            index += 0.5;
        }
        
        return {
            index: Math.round(index),
            level,
            suggestion,
            temp,
            wind,
            weather: weather.desc
        };
    }
    
    /**
     * 获取天气预警
     * @param {object} weather 
     * @returns {array} 预警列表
     */
    getWeatherAlerts(weather) {
        const alerts = [];
        const temp = weather.temp;
        const code = weather.code;
        const wind = weather.windSpeed || 0;
        
        // 高温预警
        if (temp >= 35) {
            alerts.push({
                type: '高温',
                level: temp >= 40 ? '红色' : temp >= 37 ? '橙色' : '黄色',
                icon: '🔥',
                message: `气温高达 ${temp}°C，注意防暑降温，避免长时间户外活动`
            });
        }
        
        // 低温预警
        if (temp <= -10) {
            alerts.push({
                type: '低温',
                level: '蓝色',
                icon: '❄️',
                message: `气温低至 ${temp}°C，注意保暖防寒`
            });
        }
        
        // 降雨预警
        const heavyRainCodes = [63, 65, 67, 82, 95, 96, 99];
        if (heavyRainCodes.includes(code)) {
            alerts.push({
                type: '暴雨',
                level: '黄色',
                icon: '⛈️',
                message: '有大到暴雨，出门请带伞，注意交通安全'
            });
        }
        
        // 大风预警
        if (wind >= 28) {
            alerts.push({
                type: '大风',
                level: wind >= 40 ? '橙色' : '蓝色',
                icon: '💨',
                message: `风力 ${Math.round(wind)} km/h，注意防风，远离广告牌`
            });
        }
        
        // 雾霾预警
        if (code === 45 || code === 48) {
            alerts.push({
                type: '雾霾',
                level: '黄色',
                icon: '🌫️',
                message: '有雾或雾霾，能见度低，注意交通安全'
            });
        }
        
        return alerts;
    }

    /**
     * 获取当前天气
     * @returns {object|null}
     */
    getCurrentWeather() {
        return this.currentWeather;
    }

    /**
     * 获取 GPS 定位
     * @returns {Promise<object>}
     */
    async getGPSLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('您的浏览器不支持定位'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    const messages = {
                        1: '用户拒绝了定位请求',
                        2: '位置信息不可用',
                        3: '定位超时'
                    };
                    reject(new Error(messages[error.code] || '定位失败'));
                },
                { timeout: 10000, enableHighAccuracy: false }
            );
        });
    }

    /**
     * 获取城市列表
     * @returns {array}
     */
    getCityList() {
        return Object.keys(CITY_COORDS).sort();
    }

    /**
     * 按省份分组的城市数据
     * @returns {object}
     */
    getLocationData() {
        return {
            '北京': ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区', '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区', '怀柔区', '平谷区', '密云区', '延庆区'],
            '上海': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区'],
            '天津': ['和平区', '河东区', '河西区', '南开区', '河北区', '红桥区', '东丽区', '西青区', '津南区', '北辰区', '武清区', '宝坻区', '滨海新区', '宁河区', '静海区', '蓟州区'],
            '重庆': ['渝中区', '大渡口区', '江北区', '沙坪坝区', '九龙坡区', '南岸区', '北碚区', '渝北区', '巴南区', '涪陵区', '万州区', '黔江区', '长寿区', '江津区', '合川区', '永川区', '南川区', '綦江区', '大足区', '璧山区', '铜梁区', '潼南区', '荣昌区', '开州区', '梁平区', '武隆区'],
            '广东': {
                '广州': ['天河区', '越秀区', '海珠区', '荔湾区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区', '从化区', '增城区'],
                '深圳': ['福田区', '罗湖区', '南山区', '宝安区', '龙岗区', '盐田区', '龙华区', '坪山区', '光明区'],
                '佛山': ['禅城区', '南海区', '顺德区', '三水区', '高明区'],
                '东莞': ['东城街道', '南城街道', '万江街道', '莞城街道', '石碣镇', '石龙镇', '茶山镇', '石排镇', '企石镇', '横沥镇', '桥头镇', '谢岗镇', '东坑镇', '常平镇', '寮步镇', '樟木头镇', '大朗镇', '黄江镇', '清溪镇', '塘厦镇', '凤岗镇', '大岭山镇', '长安镇', '虎门镇', '厚街镇', '沙田镇', '道滘镇', '洪梅镇', '麻涌镇', '望牛墩镇', '中堂镇', '高埗镇', '松山湖管委会', '东莞港', '东莞生态园', '东莞滨海湾新区']
            },
            '江苏': {
                '南京': ['玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区', '栖霞区', '雨花台区', '江宁区', '六合区', '溧水区', '高淳区'],
                '苏州': ['姑苏区', '虎丘区', '吴中区', '相城区', '吴江区', '常熟市', '张家港市', '昆山市', '太仓市'],
                '无锡': ['锡山区', '惠山区', '滨湖区', '梁溪区', '新吴区', '江阴市', '宜兴市'],
                '常州': ['天宁区', '钟楼区', '新北区', '武进区', '金坛区', '溧阳市']
            },
            '浙江': {
                '杭州': ['上城区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区', '富阳区', '临安区', '临平区', '钱塘区', '桐庐县', '淳安县', '建德市'],
                '宁波': ['海曙区', '江北区', '北仑区', '镇海区', '鄞州区', '奉化区', '象山县', '宁海县', '余姚市', '慈溪市'],
                '温州': ['鹿城区', '龙湾区', '瓯海区', '洞头区', '永嘉县', '平阳县', '苍南县', '文成县', '泰顺县', '瑞安市', '乐清市', '龙港市']
            },
            '四川': {
                '成都': ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '龙泉驿区', '青白江区', '新都区', '温江区', '双流区', '郫都区', '新津区', '金堂县', '大邑县', '蒲江县', '都江堰市', '彭州市', '邛崃市', '崇州市', '简阳市'],
                '绵阳': ['涪城区', '游仙区', '安州区', '三台县', '盐亭县', '梓潼县', '北川县', '平武县', '江油市']
            },
            '湖北': {
                '武汉': ['江岸区', '江汉区', '硚口区', '汉阳区', '武昌区', '青山区', '洪山区', '东西湖区', '汉南区', '蔡甸区', '江夏区', '黄陂区', '新洲区'],
                '宜昌': ['西陵区', '伍家岗区', '点军区', '猇亭区', '夷陵区', '远安县', '兴山县', '秭归县', '长阳县', '五峰县', '宜都市', '当阳市', '枝江市']
            },
            '陕西': {
                '西安': ['新城区', '碑林区', '莲湖区', '灞桥区', '未央区', '雁塔区', '阎良区', '临潼区', '长安区', '高陵区', '鄠邑区', '蓝田县', '周至县'],
                '咸阳': ['秦都区', '杨陵区', '渭城区', '三原县', '泾阳县', '乾县', '礼泉县', '永寿县', '长武县', '旬邑县', '淳化县', '武功县', '兴平市', '彬州市']
            },
            '湖南': {
                '长沙': ['芙蓉区', '天心区', '岳麓区', '开福区', '雨花区', '望城区', '长沙县', '浏阳市', '宁乡市'],
                '株洲': ['荷塘区', '芦淞区', '石峰区', '天元区', '渌口区', '攸县', '茶陵县', '炎陵县', '醴陵市']
            },
            '河南': {
                '郑州': ['中原区', '二七区', '管城回族区', '金水区', '上街区', '惠济区', '中牟县', '巩义市', '荥阳市', '新密市', '新郑市', '登封市'],
                '洛阳': ['老城区', '西工区', '瀍河回族区', '涧西区', '偃师区', '孟津区', '洛龙区', '新安县', '栾川县', '嵩县', '汝阳县', '宜阳县', '洛宁县', '伊川县']
            },
            '山东': {
                '济南': ['历下区', '市中区', '槐荫区', '天桥区', '历城区', '长清区', '章丘区', '济阳区', '莱芜区', '钢城区', '平阴县', '商河县'],
                '青岛': ['市南区', '市北区', '黄岛区', '崂山区', '李沧区', '城阳区', '即墨区', '胶州市', '平度市', '莱西市']
            },
            '福建': {
                '福州': ['鼓楼区', '台江区', '仓山区', '马尾区', '晋安区', '长乐区', '闽侯县', '连江县', '罗源县', '闽清县', '永泰县', '福清市'],
                '厦门': ['思明区', '海沧区', '湖里区', '集美区', '同安区', '翔安区']
            },
            '安徽': {
                '合肥': ['瑶海区', '庐阳区', '蜀山区', '包河区', '长丰县', '肥东县', '肥西县', '庐江县', '巢湖市']
            },
            '江西': {
                '南昌': ['东湖区', '西湖区', '青云谱区', '青山湖区', '新建区', '红谷滩区', '南昌县', '安义县', '进贤县']
            },
            '云南': {
                '昆明': ['五华区', '盘龙区', '官渡区', '西山区', '东川区', '呈贡区', '晋宁区', '富民县', '宜良县', '石林县', '嵩明县', '禄劝县', '寻甸县', '安宁市']
            },
            '贵州': {
                '贵阳': ['南明区', '云岩区', '花溪区', '乌当区', '白云区', '观山湖区', '开阳县', '息烽县', '修文县', '清镇市']
            },
            '广西': {
                '南宁': ['兴宁区', '青秀区', '江南区', '西乡塘区', '良庆区', '邕宁区', '武鸣区', '隆安县', '马山县', '上林县', '宾阳县', '横州市']
            },
            '海南': {
                '海口': ['秀英区', '龙华区', '琼山区', '美兰区']
            },
            '河北': {
                '石家庄': ['长安区', '桥西区', '新华区', '井陉矿区', '裕华区', '藁城区', '鹿泉区', '栾城区', '井陉县', '正定县', '行唐县', '灵寿县', '高邑县', '深泽县', '赞皇县', '无极县', '平山县', '元氏县', '赵县', '晋州市', '新乐市']
            },
            '山西': {
                '太原': ['小店区', '迎泽区', '杏花岭区', '尖草坪区', '万柏林区', '晋源区', '清徐县', '阳曲县', '娄烦县', '古交市']
            },
            '辽宁': {