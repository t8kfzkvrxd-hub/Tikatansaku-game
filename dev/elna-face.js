(() => {
  const stage=document.getElementById('elna-stage');
  const character=document.getElementById('elna-character');
  const base=document.getElementById('elna-base');
  const status=document.getElementById('status');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  function fit(){
    const {width,height}=stage.getBoundingClientRect();
    const scale=Math.min(width/ELNA_FACE_CONFIG.width,height/ELNA_FACE_CONFIG.height);
    character.style.transform=`translate(${(width-ELNA_FACE_CONFIG.width*scale)/2}px,${(height-ELNA_FACE_CONFIG.height*scale)/2}px) scale(${scale})`;
  }
  function result(supported,message){status.textContent=message;return {supported,message};}
  window.setElnaTalking=enabled=>enabled
    ?result(false,ELNA_FACE_CONFIG.unavailable.talking)
    :result(true,'口パク停止。正式立ち絵の口を表示しています。');
  window.setElnaExpression=name=>name==='normal'
    ?result(true,'通常表情：正式立ち絵そのままです。')
    :result(false,ELNA_FACE_CONFIG.unavailable.expression);
  window.setElnaGaze=direction=>direction==='front'
    ?result(true,'正面：正式立ち絵そのままです。')
    :result(false,ELNA_FACE_CONFIG.unavailable.gaze);
  window.blinkElna=()=>result(false,ELNA_FACE_CONFIG.unavailable.blink);
  const updateMotion=()=>{
    character.classList.toggle('still',!document.getElementById('breathing').checked);
    document.getElementById('motion-status').textContent=motion.matches?'モーション軽減：光の変化は停止中。':'呼吸感は微細な局所光のみ。画像の変形・上下移動なし。';
  };
  document.getElementById('breathing').addEventListener('change',updateMotion);
  document.getElementById('normal').addEventListener('click',()=>window.setElnaExpression('normal'));
  motion.addEventListener('change',updateMotion);
  base.addEventListener('load',()=>{fit();result(true,'正式立ち絵を読み込みました。顔差分は未使用です。');});
  base.addEventListener('error',()=>result(false,'正式立ち絵を読み込めませんでした。'));
  base.src=ELNA_FACE_CONFIG.base;
  const observer=new ResizeObserver(fit);
  observer.observe(stage);
  window.addEventListener('resize',fit,{passive:true});
  window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
  window.addEventListener('pageshow',()=>{observer.observe(stage);fit();});
  updateMotion();fit();
})();
