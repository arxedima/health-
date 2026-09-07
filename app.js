(() => {
  const toast = document.getElementById('toast');
  const sheet = document.getElementById('actionSheet');
  const backdrop = document.getElementById('sheetBackdrop');
  let toastTimer;

  function showToast(text){
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1700);
  }
  function openSheet(){
    backdrop.hidden = false;
    requestAnimationFrame(() => sheet.classList.add('open'));
    sheet.setAttribute('aria-hidden','false');
  }
  function closeSheet(){
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden','true');
    setTimeout(() => backdrop.hidden = true, 280);
  }

  document.getElementById('addButton').addEventListener('click', openSheet);
  backdrop.addEventListener('click', closeSheet);
  document.querySelectorAll('.sheet-grid button').forEach(btn => btn.addEventListener('click', () => {
    showToast(btn.textContent + ' — скоро');
    closeSheet();
  }));
  document.getElementById('planButton').addEventListener('click', () => showToast('План дня — следующий экран'));
  document.getElementById('tipButton').addEventListener('click', () => showToast('Выпей стакан воды после пробуждения'));

  const metricNames = {sport:'Спорт',food:'Питание',water:'Вода',sleep:'Сон'};
  document.querySelectorAll('.metric').forEach(btn => btn.addEventListener('click', () => showToast(metricNames[btn.dataset.kind] + ' — открыть раздел')));
  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => {
    if(btn.dataset.nav === 'home') return;
    showToast(btn.querySelector('span').textContent + ' — следующий экран');
  }));

  if('serviceWorker' in navigator){
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
})();