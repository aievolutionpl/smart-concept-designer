import {createIcons,PanelLeft,PanelRight,Maximize2,Minimize2,X} from 'lucide';

queueMicrotask(() => {
 const workspace=document.querySelector('.workspace');
 const dock=document.querySelector('.tool-dock');
 if(!workspace||!dock)return;
 const key='smart-concept-workspace';
 let preferences={left:true,right:true};
 try{const saved=JSON.parse(localStorage.getItem(key));if(saved)preferences={left:saved.left!==false,right:saved.right!==false};}catch{}
 let focused=false;
 const panels={left:document.querySelector('#library-panel'),right:document.querySelector('#inspector')};
 const controls=document.createElement('div');
 controls.className='workspace-controls';
 controls.innerHTML='<span class="divider"></span><button id="toggle-library" class="icon-button" aria-controls="library-panel"><i data-lucide="panel-left"></i></button><button id="toggle-inspector" class="icon-button" aria-controls="inspector"><i data-lucide="panel-right"></i></button><button id="focus-workspace" class="icon-button"><i data-lucide="maximize-2"></i></button>';
 dock.append(controls);
 const left=controls.querySelector('#toggle-library'),right=controls.querySelector('#toggle-inspector'),focus=controls.querySelector('#focus-workspace');
 function render(){
  const mobile=matchMedia('(max-width:760px)').matches;
  workspace.classList.toggle('workspace-focus',focused);
  for(const [side,button] of [['left',left],['right',right]]){
   const visible=!focused&&(mobile?panels[side].classList.contains('mobile-open'):preferences[side]);
   workspace.classList.toggle(`hide-${side}`,!preferences[side]);
   panels[side].inert=focused||!visible;
   button.setAttribute('aria-expanded',String(visible));
   const label=`${visible?'Ukryj':'Pokaż'} ${side==='left'?'bibliotekę':'właściwości'}`;
   button.title=label;button.setAttribute('aria-label',label);
   button.classList.toggle('panel-visible',visible);
  }
  focus.title=focused?'Wyjdź z trybu skupienia (Esc)':'Tryb skupienia';
  focus.setAttribute('aria-label',focus.title);focus.setAttribute('aria-pressed',String(focused));
  focus.classList.toggle('active',focused);
  focus.innerHTML=`<i data-lucide="${focused?'minimize-2':'maximize-2'}"></i>`;
  createIcons({icons:{PanelLeft,PanelRight,Maximize2,Minimize2,X}});
 }
 function toggle(side){
  focused=false;
  if(matchMedia('(max-width:760px)').matches){
   const open=!panels[side].classList.contains('mobile-open');
   Object.values(panels).forEach(p=>p.classList.remove('mobile-open'));
   panels[side].classList.toggle('mobile-open',open);
  }else{preferences[side]=!preferences[side];try{localStorage.setItem(key,JSON.stringify(preferences));}catch{}}
  render();
 }
 left.onclick=()=>toggle('left');right.onclick=()=>toggle('right');
 focus.onclick=()=>{focused=!focused;Object.values(panels).forEach(p=>p.classList.remove('mobile-open'));render();};
 for(const [side,panel] of Object.entries(panels)){
  const button=document.createElement('button');button.className='icon-button panel-dismiss';
  button.title=side==='left'?'Ukryj bibliotekę':'Ukryj właściwości';button.setAttribute('aria-label',button.title);
  button.innerHTML='<i data-lucide="x"></i>';button.onclick=()=>{toggle(side);(side==='left'?left:right).focus();};
  panel.querySelector('.panel-heading').append(button);
  new MutationObserver(render).observe(panel,{attributes:true,attributeFilter:['class']});
 }
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&focused){focused=false;render();focus.focus();}
 });
 matchMedia('(max-width:760px)').addEventListener('change',render);
 render();
});
