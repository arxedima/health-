(()=>{'use strict';
try{
  let b64='';
  for(let i=1;i<=14;i++){
    const req=new XMLHttpRequest();
    const part=String(i).padStart(3,'0');
    req.open('GET',`./black-glass-loop-v1/p${part}.b64?v=2`,false);
    req.send(null);
    if(req.status<200||req.status>=300)throw new Error('black-glass-music');
    b64+=req.responseText.replace(/\s+/g,'');
  }
  const raw=atob(b64);
  const bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  const musicUrl=URL.createObjectURL(new Blob([bytes],{type:'audio/mp4'}));
  const original=URL.createObjectURL.bind(URL);
  let used=false;
  URL.createObjectURL=function(blob){
    if(!used&&blob instanceof Blob&&blob.type==='audio/wav'){
      used=true;
      return musicUrl;
    }
    return original(blob);
  };
}catch(e){}
})();
