(() => {
 const compact = () => matchMedia('(orientation:landscape) and (max-height:540px) and (max-width:1100px)').matches;
 document.getElementById('sub-tabs').addEventListener('click', event => {
  const button=event.target.closest('.sub-tab-btn');
  if(!button||!compact())return;
  event.preventDefault();event.stopImmediatePropagation();
  openExplorationPanel(button.id.replace('tab-btn-',''));
  const close=document.querySelector('.update-notes-actions button');
  if(close&&state.screen==='battle')close.textContent='戦闘へ戻る';
 },true);
})();
