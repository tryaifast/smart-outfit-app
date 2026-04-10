const CONFIG={version:'9',storagePrefix:'smart_outfit_',maxWardrobeItems:50,maxUsersPerDevice:5};
const Storage={get(k){try{return JSON.parse(localStorage.getItem(CONFIG.storagePrefix+k)||'null')}catch(e){return null}},set(k,v){localStorage.setItem(CONFIG.storagePrefix+k,JSON.stringify(v))},remove(k){localStorage.removeItem(CONFIG.storagePrefix+k)}};
const Utils={id:()=>Date.now().toString(36)+Math.random().toString(36).slice(2),toast:(m,t='info')=>{const e=document.createElement('div');e.className=`toast toast-${t}`;e.textContent=m;document.body.appendChild(e);setTimeout(()=>e.remove(),3000)},nav:(p)=>{document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));document.getElementById(p)?.classList.add('active')}};

const API={
    async call(apiKey,messages,opt={}){
        const body={model:opt.model||'qwen-max',input:{messages},parameters:{temperature:opt.temperature||0.7,max_tokens:opt.max_tokens||2000,result_format:'message'}};
        const headers=apiKey.startsWith('sk-sp-')?{'Content-Type':'application/json','X-DashScope-API-Key':apiKey}:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`};
        const r=await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',{method:'POST',headers,body:JSON.stringify(body),mode:'cors'});
        if(!r.ok){const txt=await r.text();throw new Error(`HTTP ${r.status}: ${txt}`)}
        return await r.json();
    },
    fallback(profile,wardrobe,weather,occasion){
        const temp=weather.temperature||20;
        const items=wardrobe.length>0?wardrobe.slice(0,3).map(i=>i.name).join('、'):'基础款T恤、休闲裤';
        return{output:{text:`## 离线穿搭建议\n\n**风格**: ${occasion.includes('商务')?'商务正式':occasion.includes('约会')?'时尚精致':'日常休闲'}\n\n**搭配**: ${items}\n\n**建议**: 气温${temp}°C，注意${temp<10?'保暖':temp>28?'防晒':'适时增减衣物'}。\n\n*API连接失败，显示离线推荐*`}};
    },
    async recommend(profile,wardrobe,weather,occasion){
        const cfg=Storage.get('admin_config')||{};
        if(!cfg.apiKey)return this.fallback(profile,wardrobe,weather,occasion);
        const items=wardrobe.map(i=>`- ${i.category}:${i.name}`).join('\n');
        const msgs=[{role:'system',content:'你是专业穿搭顾问'},{role:'user',content:`推荐穿搭:\n用户:${profile.nickname||'用户'}\n天气:${weather.city||'?'} ${weather.temperature||'?'}°C\n场景:${occasion}\n衣橱:${items||'(暂无)'}\n给出:1.风格 2.搭配 3.理由`}];
        try{return await this.call(cfg.apiKey,msgs,{temperature:0.8,max_tokens:2000});}catch(e){return this.fallback(profile,wardrobe,weather,occasion);}
    }
};

const Weather={coords:{'北京':[39.9,116.4],'上海':[31.2,121.5],'广州':[23.1,113.3],'深圳':[22.5,114.1],'杭州':[30.3,120.2],'南京':[32.1,118.8],'成都':[30.6,104.1],'武汉':[30.6,114.3],'西安':[34.3,108.9],'重庆':[29.6,106.6]},async get(city){const c=this.coords[city];if(!c)throw new Error('不支持');const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c[0]}&longitude=${c[1]}&current=temperature_2m,weather_code&timezone=auto`);const d=await r.json();const w={0:'晴',1:'多云',3:'阴',51:'小雨',53:'中雨',55:'大雨'};return{city,temperature:d.current.temperature_2m,condition:w[d.current.weather_code]||'未知'}}};

const User={get current(){return Storage.get('current_user')},set current(u){Storage.set('current_user',u)},get(p){return Storage.get('user_'+p)},save(u){Storage.set('user_'+u.phone,u)},deviceId(){let id=Storage.get('device_id');if(!id){id=Utils.id();Storage.set('device_id',id)}return id},deviceCount(){const r=Storage.get('device_registrations')||{};return Object.values(r).filter(x=>x.deviceId===this.deviceId()).length},register(p,w){if(this.get(p))return{ok:false,msg:'已注册'};if(this.deviceCount()>=CONFIG.maxUsersPerDevice)return{ok:false,msg:'设备上限(5)'};const u={phone:p,password:btoa(w),nickname:'',gender:'',ageGroup:'',occupation:'',income:'',stylePreference:'',city:'',location:'',wardrobe:[],createdAt:new Date().toISOString()};this.save(u);const r=Storage.get('device_registrations')||{};r[p]={deviceId:this.deviceId(),registeredAt:new Date().toISOString()};Storage.set('device_registrations',r);return{ok:true,user:u}},login(p,w){const u=this.get(p);if(!u)return{ok:false,msg:'不存在'};if(u.password!==btoa(w))return{ok:false,msg:'密码错误'};this.current=u;return{ok:true,user:u}},logout(){Storage.remove('current_user')},update(v){const u=this.current;if(!u)return{ok:false};Object.assign(u,v);u.updatedAt=new Date().toISOString();this.save(u);this.current=u;return{ok:true}}};

const Wardrobe={get items(){return User.current?.wardrobe||[]},add(item){const u=User.current;if(!u)return{ok:false};item.id=Utils.id();item.createdAt=new Date().toISOString();u.wardrobe.push(item);if(u.wardrobe.length>CONFIG.maxWardrobeItems)u.wardrobe.shift();User.save(u);User.current=u;return{ok:true}},remove(id){const u=User.current;if(!u)return{ok:false};u.wardrobe=u.wardrobe.filter(x=>x.id!==id);User.save(u);User.current=u;return{ok:true}}};

function showLogin(){document.getElementById('login-form')?.classList.remove('hidden');document.getElementById('register-form')?.classList.add('hidden')}
function showRegister(){document.getElementById('login-form')?.classList.add('hidden');document.getElementById('register-form')?.classList.remove('hidden')}
function loadHome(){const u=User.current;if(!u)return;document.getElementById('home-nickname')?.textContent=u.nickname||u.phone;document.getElementById('home-city')?.textContent=u.city||'未设置';document.getElementById('profile-nickname')?.value=u.nickname||'';document.getElementById('profile-gender')?.value=u.gender||'';document.getElementById('profile-age')?.value=u.ageGroup||'';document.getElementById('profile-occupation')?.value=u.occupation||'';document.getElementById('profile-income')?.value=u.income||'';document.getElementById('profile-style')?.value=u.stylePreference||'';document.getElementById('profile-city')?.value=u.city||'';renderWardrobe()}
function renderWardrobe(){const l=document.getElementById('wardrobe-list');if(!l)return;l.innerHTML=Wardrobe.items.map(i=>`<div class="wardrobe-item"><span>${i.category}: ${i.name}${i.color?` (${i.color})`:''}</span><button onclick="Wardrobe.remove('${i.id}');renderWardrobe()">删除</button></div>`).join('')||'<p class="empty">衣橱为空</p>'}

function handleLogin(){const p=document.getElementById('login-phone')?.value.trim();const w=document.getElementById('login-password')?.value;if(!p||!w)return Utils.toast('请填写信息','error');const r=User.login(p,w);if(r.ok){Utils.toast('登录成功');Utils.nav('home-page');loadHome()}else{Utils.toast(r.msg,'error')}}
function handleRegister(){const p=document.getElementById('reg-phone')?.value.trim();const w=document.getElementById('reg-password')?.value;const c=document.getElementById('reg-confirm')?.value;if(!p||!w||!c)return Utils.toast('请填写信息','error');if(w!==c)return Utils.toast('密码不一致','error');const r=User.register(p,w);if(r.ok){Utils.toast('注册成功');showLogin()}else{Utils.toast(r.msg,'error')}}
function handleSaveProfile(){const r=User.update({nickname:document.getElementById('profile-nickname')?.value,gender:document.getElementById('profile-gender')?.value,ageGroup:document.getElementById('profile-age')?.value,occupation:document.getElementById('profile-occupation')?.value,income:document.getElementById('profile-income')?.value,stylePreference:document.getElementById('profile-style')?.value,city:document.getElementById('profile-city')?.value});Utils.toast(r.ok?'保存成功':'保存失败',r.ok?'info':'error')}
async function handleGetWeather(){const c=User.current?.city;if(!c)return Utils.toast('请先设置城市','error');try{const w=await Weather.get(c);document.getElementById('weather-info')?.textContent=`${w.city} ${w.temperature}°C ${w.condition}`;Utils.toast('天气更新成功')}catch(e){Utils.toast('获取天气失败','error')}}
function handleAddWardrobe(){const c=document.getElementById('item-category')?.value;const n=document.getElementById('item-name')?.value?.trim();const col=document.getElementById('item-color')?.value;if(!n)return Utils.toast('请输入名称','error');const r=Wardrobe.add({category:c,name:n,color:col});if(r.ok){