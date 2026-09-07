(() => {
  const button = document.getElementById('themeButton');
  const shell = document.getElementById('appShell');
  if(!button || !shell) return;

  button.addEventListener('click', () => {
    const dark = !shell.classList.contains('dark');
    shell.classList.toggle('dark', dark);
    document.getElementById('greetingTitle').innerHTML = dark ? 'Спокойный вечер,<br>Дмитрий' : 'Доброе утро,<br>Дмитрий';
    document.getElementById('greetingText').textContent = dark ? 'Хороший день. Время восстановиться.' : 'Пора сделать первый шаг.';
    document.getElementById('tipEyebrow').textContent = dark ? 'Сейчас важно' : 'Совет дня';
    document.getElementById('tipTitle').textContent = dark ? 'Подготовка ко сну' : 'Стакан воды';
    document.getElementById('tipText').innerHTML = dark ? '10 минут дыхательной<br>практики улучшат сон.' : 'После пробуждения<br>запускает метаболизм.';
  });
})();