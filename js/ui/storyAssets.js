// Presentation only. No story progress, inventory or save state is stored here.
const STORY_PORTRAITS={
 player:{name:'主人公'},
 elna:{name:'エルナ'},
 tavern_master:{name:'酒場主人'},
 blacksmith:{name:'鍛冶屋'},
 item_shopkeeper:{name:'道具屋店主'}
};
const STORY_SPEAKER_IDS={'酒場主人':'tavern_master','鍛冶屋':'blacksmith','道具屋店主':'item_shopkeeper'};
const STORY_SCENE_IMAGES={
 tavern:{background:'tavern',npc:'tavern_master'},
 forge:{background:'forge',npc:'blacksmith'},
 warehouse:{background:'warehouse',npc:'blacksmith'},
 // The existing shop dialogue is the tavern master's advice, not a shopkeeper line.
 shop:{background:'item-shop',npc:'tavern_master'},
 equipment:{background:'forge'},
 ending:{background:'tavern',npc:'tavern_master'}
};
// Index-based visual direction leaves the original speaker/text tuples untouched.
const STORY_EXPRESSION_CUES={
 tavern:{3:'exasperated',5:'serious',6:'normal'},
 forge:{0:'normal',2:'confident'},
 warehouse:{0:'serious'},shop:{0:'serious'},ending:{4:'serious'}
};
function storySpeakerId(speaker){return STORY_SPEAKER_IDS[speaker]||speaker;}
function storyPortraitPath(id,expression='normal'){
 if(!STORY_PORTRAITS[id])return '';
 if(!MAIN_STORY_EXPRESSIONS[id]?.includes(expression)||STORY_PORTRAITS[id].unavailable?.includes(expression))expression='normal';
 return `assets/story/characters/${id}/${expression}.png`;
}
function storyVisualState(scene,page){
 const data=MAIN_STORY_SCENES[scene],visual=STORY_SCENE_IMAGES[scene]||{};
 const speaker=storySpeakerId(data.lines[page]?.[0]),expressions={};
 for(let i=0;i<=page;i++){
  const line=data.lines[i];if(!line)break;
  const id=storySpeakerId(line[0]);
  if(STORY_PORTRAITS[id])expressions[id]=STORY_EXPRESSION_CUES[scene]?.[i]||line[2]||'normal';
 }
 // NPCs never swap into the player's slot. A player monologue doesn't make the NPC respond.
 const cast=visual.npc?[speaker==='player'?'player':'elna',visual.npc]:['player','elna'];
 return {speaker,cast,expressions,background:visual.background?`assets/story/backgrounds/${visual.background}.png`:''};
}
function storyPortraitMarkup(visual){
 return visual.cast.map(id=>{
  const expression=visual.expressions[id]||'normal';
  return `<img class="story-portrait ${visual.speaker===id?'speaking':''}" data-character="${id}" data-expression="${expression}" data-story-src="${storyPortraitPath(id,expression)}" data-normal-src="${storyPortraitPath(id)}" alt="${STORY_PORTRAITS[id].name}" width="684" height="919">`;
 }).join('');
}
function bindStoryImages(container,background,entering){
 for(const img of container.querySelectorAll('.story-portrait')){
  const normal=img.dataset.normalSrc;let fallback=false;
  img.onerror=()=>{
   if(!fallback&&img.getAttribute('src')!==normal){fallback=true;img.dataset.fallback='normal';img.src=normal;}
   else {img.onerror=null;img.hidden=true;img.removeAttribute('src');img.dataset.fallback='hidden';}
  };
  img.onload=()=>{img.dataset.loaded='true';};
  img.src=img.dataset.storySrc;
 }
 if(background){
  const img=container.querySelector('.story-background');
  img.onerror=()=>{img.onerror=null;img.hidden=true;img.removeAttribute('src');img.dataset.fallback='existing';};
  img.onload=()=>{img.classList.add('loaded');if(entering)img.classList.add('fade-in');};
  img.src=background;
 }
}
