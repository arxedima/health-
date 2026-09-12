(()=>{'use strict';
try{
  let b64='';
  for(let i=0;i<7;i++){
    const req=new XMLHttpRequest();
    req.open('GET',`./black-glass-30s-v1/p${String(i).padStart(2,'0')}.b64?v=4`,false);
    req.send(null);
    if(req.status<200||req.status>=300)throw new Error('black-glass-music');
    b64+=req.responseText.replace(/\s+/g,'');
  }
  const raw=atob(b64);
  const bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  const musicBlob=new Blob([bytes],{type:'audio/mp4'});
  const original=URL.createObjectURL.bind(URL);
  let musicUrl='';
  URL.createObjectURL=function(blob){
    if(blob instanceof Blob&&blob.type==='audio/wav'){
      if(!musicUrl)musicUrl=original(musicBlob);
      return musicUrl;
    }
    return original(blob);
  };
}catch(e){console.error('IRIS music load failed',e)}
})();
