(()=>{'use strict';
try{
  const req=new XMLHttpRequest();
  req.open('GET','./black-glass-breathing.m4a.b64?v=1',false);
  req.send(null);
  if(req.status>=200&&req.status<300){
    const b64=req.responseText.replace(/\s+/g,'');
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
  }
}catch(e){}
})();
