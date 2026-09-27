export function mountEnvironmentImport(importFile){
 const section=document.querySelector('.environment-section');
 const button=document.createElement('button');button.id='import-environment';button.className='button subtle';button.textContent='Dodaj environment';section.prepend(button);
 const dialog=document.createElement('dialog');dialog.id='environment-import-dialog';dialog.className='glass';
 dialog.innerHTML=`<form id="environment-import-form"><h2>Własne otoczenie</h2><label class="environment-label">Plik GLB · maks. 30 MB<input id="environment-file" type="file" accept=".glb,model/gltf-binary" required></label><label class="property-row">Zastąp wbudowane otoczenie<input id="environment-replace" type="checkbox" checked></label><p id="environment-import-error" role="alert"></p><div class="environment-actions"><button type="button" id="environment-import-cancel" class="button subtle">Anuluj</button><button type="submit" id="environment-import-submit" class="button primary">Importuj</button></div></form>`;
 document.body.append(dialog);
 button.onclick=()=>{dialog.querySelector('#environment-import-error').textContent='';dialog.showModal();};
 dialog.querySelector('#environment-import-cancel').onclick=()=>dialog.close();
 dialog.querySelector('form').onsubmit=async event=>{
  event.preventDefault();const file=dialog.querySelector('#environment-file').files[0];if(!file)return;
  const submit=dialog.querySelector('#environment-import-submit'),cancel=dialog.querySelector('#environment-import-cancel');submit.disabled=cancel.disabled=true;submit.textContent='Importowanie…';
  try{if(!/\.glb$/i.test(file.name))throw Error('Wybierz plik .glb z osadzonymi teksturami.');if(file.size>30*1024*1024)throw Error('Maksymalny rozmiar: 30 MB.');await importFile(file,dialog.querySelector('#environment-replace').checked);dialog.close();dialog.querySelector('#environment-file').value='';}
  catch(error){dialog.querySelector('#environment-import-error').textContent=error.message;}
  finally{submit.disabled=cancel.disabled=false;submit.textContent='Importuj';}
 };
 dialog.addEventListener('cancel',event=>{if(dialog.querySelector('#environment-import-submit').disabled)event.preventDefault();});
}
