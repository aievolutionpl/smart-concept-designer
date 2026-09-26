import {cleanWeather,clockLabel} from './daylight.js';

export function mountDaylight({get,set}){
 const panel=document.querySelector('.light-section');
 panel.innerHTML=`<div class="section-title"><span>Słońce i atmosfera</span><output id="time-label"></output></div>
 <input type="range" id="sun-time" min="6" max="22" step="0.25" aria-label="Godzina światła"><div class="range-labels"><span>06:00</span><span>22:00</span></div>
 <div class="day-presets"><button data-hour="9">Rano</button><button data-hour="13">Dzień</button><button data-hour="19">Zachód</button><button data-hour="21">Wieczór</button></div>
 <label class="weather-control">Zachmurzenie <output id="cloud-label"></output><input id="cloud-cover" type="range" min="0" max="100" step="5"></label>
 <label class="weather-control" title="Poglądowa trajektoria słońca. Nie jest to analiza nasłonecznienia dla lokalizacji i daty.">Kierunek słońca <output id="sun-direction-label"></output><input id="sun-direction" type="range" min="0" max="360" step="5"></label>
 <label class="weather-select">Lampy ogrodowe<select id="lamp-mode"><option value="auto">Automatycznie</option><option value="on">Włączone</option><option value="off">Wyłączone</option></select></label>
 <label class="weather-control">Moc lamp <output id="lamp-power-label"></output><input id="lamp-power" type="range" min="0" max="2" step="0.1"></label>
 <label class="weather-select">Jakość cieni<select id="light-quality"><option value="eco">Oszczędna</option><option value="balanced">Zrównoważona</option><option value="high">Wysoka</option></select></label>`;
 function render(){const state=get(),w=cleanWeather(state.weather);document.querySelector('#sun-time').value=state.time;document.querySelector('#time-label').textContent=clockLabel(state.time);for(const [id,key] of [['cloud-cover','clouds'],['sun-direction','direction'],['lamp-mode','lamps'],['lamp-power','lampPower'],['light-quality','quality']])document.getElementById(id).value=w[key];document.getElementById('cloud-label').textContent=`${w.clouds}%`;document.getElementById('sun-direction-label').textContent=`${w.direction}°`;document.getElementById('lamp-power-label').textContent=`${Math.round(w.lampPower*100)}%`;panel.querySelectorAll('[data-hour]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.hour)===state.time)));}
 for(const [id,key] of [['cloud-cover','clouds'],['sun-direction','direction'],['lamp-mode','lamps'],['lamp-power','lampPower'],['light-quality','quality']]){const input=document.getElementById(id);input.addEventListener('input',()=>{set(key,input.tagName==='SELECT'?input.value:Number(input.value));render();});}
 panel.querySelectorAll('[data-hour]').forEach(b=>b.onclick=()=>{const slider=document.getElementById('sun-time');slider.dispatchEvent(new Event('pointerdown'));slider.value=b.dataset.hour;slider.dispatchEvent(new Event('input'));render();});
 render();return render;
}
