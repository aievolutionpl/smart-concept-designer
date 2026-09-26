export function mountCatalog(catalog,{apply,current,environment}){
 const content=document.querySelector('#assets-content');
 const nav=document.createElement('div');nav.className='catalog-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Rodzaj zasobów');
 nav.innerHTML='<button role="tab" aria-selected="true" id="catalog-models">Modele 3D</button><button role="tab" aria-selected="false" id="catalog-materials">Materiały</button>';
 content.prepend(nav);
 const panel=document.createElement('section');panel.id='material-library';panel.hidden=true;
 panel.innerHTML='<label class="surface-target">Powierzchnia<select id="surface-target"><option value="patio">Taras</option><option value="deck">Podest drewniany</option></select></label><div id="material-cards"></div><button id="reset-surface" class="button subtle">Przywróć materiał</button>';
 content.append(panel);
 const cards=panel.querySelector('#material-cards'),target=panel.querySelector('select');
 function render(){
  const selection=current();cards.replaceChildren();
  for(const asset of catalog.filter(a=>a.kind==='material'&&a.targets.includes(target.value))){
   const card=document.createElement('article');card.className='asset-card material-card';
   const img=document.createElement('img');img.src=asset.preview;img.alt=asset.name;img.loading='lazy';card.append(img);
   const title=document.createElement('h3');title.textContent=asset.name;card.append(title);
   const details=document.createElement('p');details.textContent=`1K · ${asset.dimensions.width} × ${asset.dimensions.depth} m · ${(asset.bytes/1048576).toFixed(1)} MB`;card.append(details);
   const source=document.createElement('a');source.href=asset.source.url;source.target='_blank';source.rel='noopener';source.textContent=`${asset.source.provider} · CC0`;card.append(source);
   const button=document.createElement('button');button.className='button subtle';button.textContent=selection?.[target.value]===asset.id?'Zastosowano':'Zastosuj';button.disabled=environment()!=='customer';button.onclick=async()=>{button.disabled=true;try{await apply(target.value,asset.id);}finally{render();}};card.append(button);cards.append(card);
  }
  panel.querySelector('#reset-surface').disabled=environment()!=='customer';
 }
 for(const id of ['models','materials'])nav.querySelector(`#catalog-${id}`).onclick=()=>{
  const materials=id==='materials';panel.hidden=!materials;
  for(const selector of ['.search','.filter-row','#asset-list','#import-asset'])content.querySelector(selector).hidden=materials;
  nav.querySelector('#catalog-models').setAttribute('aria-selected',String(!materials));nav.querySelector('#catalog-materials').setAttribute('aria-selected',String(materials));render();
 };
 target.onchange=render;panel.querySelector('#reset-surface').onclick=async()=>{await apply(target.value,null);render();};
 render();return render;
}
