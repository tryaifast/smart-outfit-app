// 智能穿搭助手 - 主应用脚本 v10
const CONFIG={version:'10',storagePrefix:'smart_outfit_',maxWardrobeItems:50,maxUsersPerDevice:5,adminAccount:{username:'admin',password:'admin123'}};
const Storage={get(k){try{return JSON.parse(localStorage.getItem(CONFIG.storagePrefix+k)||'null')}catch(e){return null}},set(k,v){localStorage.setItem(CONFIG.storagePrefix+k,JSON.stringify(v))},remove(k){localStorage.removeItem(CONFIG.storagePrefix+k)}};
const Utils={id:()=>Date.now().toString(36)+Math.random().toString(36).slice(2),toast:(m,t='info')=>{const e=document.createElement('div');e.className=`toast toast-${t}`;e.textContent=m;document.body.appendChild(e);setTimeout(()=>e.remove(),3000)}};

let currentUser=null;

// 初始化
document.addEventListener('DOMContentLoaded',init);

function init(){
    const user=Storage.get('current_user');
    if(user){currentUser=user;showMainApp();loadUserData();}
    else{showLoginPage();}
}

function showLoginPage(){
    document.getElementById('loginPage').style.display='flex';
    document.getElementById('mainApp').style.display='none';
    document.getElementById('adminPage').style.display='none';
}

function showMainApp(){
    document.getElementById('loginPage').style.display='none';
    document.getElementById('mainApp').style.display='block';
    document.getElementById('adminPage').style.display='none';
    updateWeather();
}

function switchToLogin(){
    document.getElementById('loginForm').style.display='block';
    document.getElementById('registerForm').style.display='none';
}

function switchToRegister(){
    document.getElementById('loginForm').style.display='none';
    document.getElementById('registerForm').style.display='block';
}

function getDeviceId(){
    let id=Storage.get('device_id');
    if(!id){id=Utils.id();Storage.set('device_id',id);}
    return id;
}

function handleLogin(){
    const phone=document.getElementById('loginPhone').value.trim();
    const password=document.getElementById('loginPassword').value;
    const errorEl=document.getElementById('loginError');
    if(!phone||!password){errorEl.textContent='请填写手机号和密码';return;}
    const users=Storage.get('users')||{};
    const user=users[phone];
    if(!user){errorEl.textContent='用户不存在';return;}
    if(user.password!==btoa(password)){errorEl.textContent='密码错误';return;}
    currentUser=user;
    Storage.set('current_user',user);
    errorEl.textContent='';
    showMainApp();
    loadUserData();
    Utils.toast('登录成功');
}

function handleRegister(){
    const phone=document.getElementById('regPhone').value.trim();
    const password=document.getElementById('regPassword').value;
    const confirm=document.getElementById('regConfirmPassword').value;
    const errorEl=document.getElementById('regError');
    if(!phone||!password||!confirm){errorEl.textContent='请填写所有信息';return;}
    if(password!==confirm){errorEl.textContent='两次密码不一致';return;}
    if(password.length<6){errorEl.textContent='密码至少6位';return;}
    const deviceId=getDeviceId();
    const deviceRegs=Storage.get('device_registrations')||{};
    const userRegs=Object.values(deviceRegs).filter(r=>r.deviceId===deviceId);
    if(userRegs.length>=CONFIG.maxUsersPerDevice){errorEl.textContent='该设备注册次数已达上限(5次)';return;}
    const users=Storage.get('users')||{};
    if(users[phone]){errorEl.textContent='该手机号已注册';return;}
    const newUser={phone,password:btoa(password),nickname:'',gender:'',ageRange:'',income:'',occupation:'',style:'',city:'',location:'',wardrobe:[],createdAt:new Date().toISOString()};
    users[phone]=newUser;
    Storage.set('users',users);
    deviceRegs[phone]={deviceId,registeredAt:new Date().toISOString()};
    Storage.set('device_registrations',deviceRegs);
    errorEl.textContent='';
    Utils.toast('注册成功，请登录');
    switchToLogin();
}

function loadUserData(){
    if(!currentUser)return;
    document.getElementById('profileName').textContent=currentUser.nickname||'未设置昵称';
    document.getElementById('profilePhone').textContent=currentUser.phone;
    document.getElementById('editNickname').value=currentUser.nickname||'';
    document.getElementById('editGender').value=currentUser.gender||'';
    document.getElementById('editAgeRange').value=currentUser.ageRange||'';
    document.getElementById('editIncome').value=currentUser.income||'';
    document.getElementById('editOccupation').value=currentUser.occupation||'';
    document.getElementById('editStyle').value=currentUser.style||'';
    renderWardrobe();
}

function saveProfile(){
    if(!currentUser)return;
    currentUser.nickname=document.getElementById('editNickname').value;
    currentUser.gender=document.getElementById('editGender').value;
    currentUser.ageRange=document.getElementById('editAgeRange').value;
    currentUser.income=document.getElementById('editIncome').value;
    currentUser.occupation=document.getElementById('editOccupation').value;
    currentUser.style=document.getElementById('editStyle').value;
    const users=Storage.get('users')||{};
    users[currentUser.phone]=currentUser;
    Storage.set('users',users);
    Storage.set('current_user',currentUser);
    loadUserData();
    Utils.toast('资料已保存');
}

function logout(){
    currentUser=null;
    Storage.remove('current_user');
    showLoginPage();
    Utils.toast('已退出登录');
}

async function updateWeather(){
    if(!currentUser||!currentUser.city){document.getElementById('currentLocation').textContent='点击设置位置';return;}
    document.getElementById('currentLocation').textContent=currentUser.city;
    const cityCoords={'北京':[39.9,116.4],'上海':[31.2,121.5],'广州':[23.1,113.3],'深圳':[22.5,114.1],'杭州':[30.3,120.2],'南京':[32.1,118.8],'成都':[30.6,104.1],'武汉':[30.6,114.3],'西安':[34.3,108.9],'重庆':[29.6,106.6]};
    const coords=cityCoords[currentUser.city];
    if(!coords)return;
    try{
        const res=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&current=temperature_2m,weather_code&timezone=auto`);
        const data=await res.json();
        document.getElementById('weatherTemp').textContent=Math.round(data.current.temperature_2m)+'°';
        document.getElementById('weatherDesc').textContent=getWeatherDesc(data.current.weather_code);
    }catch(e){console.error('天气获取失败',e);}
}

function getWeatherDesc(code){
    const desc={0:'晴',1:'多云',2:'多云',3:'阴',45:'雾',48:'雾',51:'小雨',53:'中雨',55:'大雨'};
    return desc[code]||'多云';
}

function openLocationModal(){document.getElementById('locationModal').style.display='flex';}
function closeLocationModal(){document.getElementById('locationModal').style.display='none';}
function selectLocationType(type){
    document.querySelectorAll('.location-type-btn').forEach(b=>b.classList.remove('active'));
    event.target.classList.add('active');
    if(type==='auto'){document.getElementById('autoLocationSection').style.display='block';document.getElementById('manualLocationSection').style.display='none';}
    else{document.getElementById('autoLocationSection').style.display='none';document.getElementById('manualLocationSection').style.display='block';initLocationData();}
}

const locationData={'北京':['东城区','西城区','朝阳区','海淀区'],'上海':['黄浦区','徐汇区','长宁区','静安区'],'广东':{'广州':['天河区','越秀区','海珠区'],'深圳':['福田区','罗湖区','南山区']}};

function initLocationData(){
    const provinceSelect=document.getElementById('provinceSelect');
    provinceSelect.innerHTML='<option value="">选择省份</option>'+Object.keys(locationData).map(p=>`<option value="${p}">${p}</option>`).join('');
}

function onProvinceChange(){
    const province=document.getElementById('provinceSelect').value;
    const citySelect=document.getElementById('citySelect');
    const districtSelect=document.getElementById('districtSelect');
    if(!province){citySelect.innerHTML='<option value="">选择城市</option>';districtSelect.innerHTML='<option value="">选择区县</option>';return;}
    const cities=locationData[province];
    if(Array.isArray(cities)){citySelect.innerHTML='<option value="">选择城市</option><option value="'+province+'">'+province+'</option>';}
    else{citySelect.innerHTML='<option value="">选择城市</option>'+Object.keys(cities).map(c=>`<option value="${c}">${c}</option>`).join('');}
    districtSelect.innerHTML='<option value="">选择区县</option>';
}

function onCityChange(){
    const province=document.getElementById('provinceSelect').value;
    const city=document.getElementById('citySelect').value;
    const districtSelect=document.getElementById('districtSelect');
    if(!city){districtSelect.innerHTML='<option value="">选择区县</option>';return;}
    const districts=Array.isArray(locationData[province])?locationData[province]:locationData[province][city];
    districtSelect.innerHTML='<option value="">选择区县</option>'+(districts||[]).map(d=>`<option value="${d}">${d}</option>`).join('');
}

function confirmLocation(){
    const province=document.getElementById('provinceSelect').value;
    const city=document.getElementById('citySelect').value;
    const district=document.getElementById('districtSelect').value;
    const street=document.getElementById('streetInput').value;
    if(!province||!city){Utils.toast('请选择完整地址');return;}
    currentUser.city=city;
    currentUser.location=`${province}${city}${district||''}${street||''}`;
    const users=Storage.get('users')||{};
    users[currentUser.phone]=currentUser;
    Storage.set('users',users);
    Storage.set('current_user',currentUser);
    closeLocationModal();
    updateWeather();
    Utils.toast('位置已更新');
}

function getCurrentLocation(){
    if(!navigator.geolocation){Utils.toast('您的浏览器不支持定位');return;}
    document.getElementById('locationStatus').textContent='正在获取位置...';
    navigator.geolocation.getCurrentPosition(
        (pos)=>{document.getElementById('locationStatus').textContent='定位成功: '+pos.coords.latitude.toFixed(2)+','+pos.coords.longitude.toFixed(2);},
        (err)=>{document.getElementById('locationStatus').textContent='定位失败: '+err.message;}
    );
}

function addToWardrobe(){
    const text=document.getElementById('newClothes').value.trim();
    if(!text){Utils.toast('请输入衣物描述');return;}
    const items=text.split(/\n/).filter(l=>l.trim());
    items.forEach(item=>{
        if(currentUser.wardrobe.length>=CONFIG.maxWardrobeItems){return;}
        currentUser.wardrobe.push({id:Utils.id(),name:item.trim(),addedAt:new Date().toISOString()});
    });
    const users=Storage.get('users')||{};
    users[currentUser.phone]=currentUser;
    Storage.set('users',users);
    Storage.set('current_user',currentUser);
    document.getElementById('newClothes').value='';
    renderWardrobe();
    Utils.toast('已添加'+items.length+'件衣物');
}

function renderWardrobe(){
    const list=document.getElementById('wardrobeList');
    if(!currentUser||!currentUser.wardrobe||currentUser.wardrobe.length===0){list.innerHTML='<div style="grid-column:1/-1;text-align:center;color:#999;padding:20px;">衣橱是空的，快去添加吧</div>';return;}
    list.innerHTML=currentUser.wardrobe.map(item=>`<div style="background:#f8f9fa;padding:12px;border-radius:10px;display:flex;justify-content:space-between;align-items:center;"><span>${item.name}</span><button onclick="removeFromWardrobe('${item.id}')" style="background:#dc3545;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">删除</button></div>`).join('');
}

function removeFromWardrobe(id){
    currentUser.wardrobe=currentUser.wardrobe.filter(i=>i.id!==id);
    const users=Storage.get('users')||{};
    users[currentUser.phone]=currentUser;
    Storage.set('users',users);
    Storage.set('current_user',currentUser);
    renderWardrobe();
}

async function getRecommendation(){
    const occasion=document.querySelector('.tag.selected')?.dataset.value;
    if(!occasion){Utils.toast('请先选择场合');return;}
    const config=Storage.get('admin_config')||{};
    if(!config.apiKey){Utils.toast('请先配置API Key（点击右下角设置）');return;}
    document.getElementById('loading').style.display='block';
    document.getElementById('resultCard').style.display='none';
    try{
        const wardrobeText=currentUser.wardrobe.map(i=>i.name).join(', ')||'暂无衣物';
        const weatherText=document.getElementById('weatherDesc').textContent+' '+document.getElementById('weatherTemp').textContent;
        const prompt=`用户画像：${currentUser.nickname||'用户'}, ${currentUser.gender||'未知'}, ${currentUser.ageRange||'未知'}, ${currentUser.occupation||'未知职业'}, 收入${currentUser.income||'未知'}, 风格偏好${currentUser.style||'未知'}
天气：${weatherText}
场合：${occasion}
衣橱：${wardrobeText}
请推荐3套穿搭方案，每套包含：1.风格定位 2.具体搭配（上衣+下装+鞋+配饰）3.推荐理由`;
        const headers=config.apiKey.startsWith('sk-sp-')?{'Content-Type':'application/json','X-DashScope-API-Key':config.apiKey}:{'Content-Type':'application/json','Authorization':'Bearer '+config.apiKey};
        const res=await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',{method:'POST',headers,body:JSON.stringify({model:'qwen-max',input:{messages:[{role:'system',content:'你是专业穿搭顾问'},{role:'user',content:prompt}]},parameters:{temperature:0.8,max_tokens:2000,result_format:'message'}}),mode:'cors'});
        const data=await res.json();
        const text=data.output?.text||data.output?.message?.content||JSON.stringify(data);
        document.getElementById('outfitList').innerHTML=text.replace(/\n/g,'<br>');
        document.getElementById('resultCard').style.display='block';
    }catch(e){
        console.error(e);
        Utils.toast('生成失败，请检查API配置');
    }finally{
        document.getElementById('loading').style.display='none';
    }
}

function handleAvatarUpload(e){
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
        document.getElementById('avatarImg').src=ev.target.result;
        document.getElementById('avatarImg').style.display='block';
        document.getElementById('avatarPlaceholder').style.display='none';
    };
    reader.readAsDataURL(file);
}

function openAdminLogin(){document.getElementById('adminLoginModal').style.display='flex';}
function closeAdminLogin(){document.getElementById('adminLoginModal').style.display='none';}

function handleAdminLogin(){
    const username=document.getElementById('adminUsername').value;
    const password=document.getElementById('adminPassword').value;
    const errorEl=document.getElementById('adminLoginError');
    if(username!==CONFIG.adminAccount.username||password!==CONFIG.adminAccount.password){errorEl.textContent='账号或密码错误';return;}
    errorEl.textContent='';
    closeAdminLogin();
    showAdminPage();
}

function showAdminPage(){
    document.getElementById('loginPage').style.display='none';
    document.getElementById('mainApp').style.display='none';
    document.getElementById('adminPage').style.display='block';
    const users=Storage.get('users')||{};
    document.getElementById('adminUserCount').textContent=Object.keys(users).length;
    const config=Storage.get('admin_config')||{};
    document.getElementById('adminApiKey').value=config.apiKey||'';
    document.getElementById('apiProvider').value=config.provider||'aliyun';
}

function closeAdmin(){if(currentUser){showMainApp();}else{showLoginPage();}}

function saveAdminConfig(){
    const config={apiKey:document.getElementById('adminApiKey').value.trim(),provider:document.getElementById('apiProvider').value};
    Storage.set('admin_config',config);
    Utils.toast('配置已保存');
}

function clearAdminConfig(){
    Storage.remove('admin_config');
    document.getElementById('adminApiKey').value='';
    Utils.toast('配置已清除');
}

// 标签选择
document.addEventListener('click',(e)=>{
    if(e.target.classList.contains('tag')){
        document.querySelectorAll('.tag').forEach(t=>t.classList.remove('selected'));
        e.target.classList.add('selected');
    }
});

// 导航切换
document.querySelectorAll('.nav-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
        document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// 暴露全局函数供HTML调用
window.handleLogin=handleLogin;
window.handleRegister=handleRegister;
window.switchToLogin=switchToLogin;
window.switchToRegister=switchToRegister;
window.saveProfile=saveProfile;
window.logout=logout;
window.openLocationModal=openLocationModal;
window.closeLocationModal=closeLocationModal;
window.selectLocationType=selectLocationType;
window.onProvinceChange=onProvinceChange;
window.onCityChange=onCityChange;
window.confirmLocation=confirmLocation;
window.getCurrentLocation=getCurrentLocation;
window.addToWardrobe=addToWardrobe;
window.removeFromWardrobe=removeFromWardrobe;
window.getRecommendation=getRecommendation;
window.handleAvatarUpload=handleAvatarUpload;
window.openAdminLogin=openAdminLogin;
window.closeAdminLogin=closeAdminLogin;
window.handleAdminLogin=handleAdminLogin;
window.closeAdmin=closeAdmin;
window.saveAdminConfig=saveAdminConfig;
window.clearAdminConfig=clearAdminConfig;