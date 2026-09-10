const FORGE_CHILDREN={};for(const row of FORGE_INDEX)if(row.r.parent)(FORGE_CHILDREN[row.r.parent] ||= []).push(row);
function forgeRecipeRevealed(id){const r=CRAFT_RECIPES[id];return !!r&&recipeVisible(id)&&(!r.hiddenMaterial||!materialProgressionIssue(r.rarity)&&(!r.unlockFloor||clearedMaterialMilestone(r.unlockFloor)));}
function ownedBuildProgress(b,actor=forgeFilters.character){const items=forgeOwnership().filter(i=>!equipmentOwner(i)||equipmentOwner(i)===actor),tags=buildTags(Object.fromEntries(items.map((item,i)=>[i,item])));return b.requiredTags.filter(t=>tags.has(t)).length;}
function materialExploreHtml(key){return materialSources(key).slice(0,6).map(row=>{const floor=row.floors[0];return floor<=state.deepestFloorReached&&state.screen==='town'?`<button class="btn btn-sub" onclick="planMaterialExploration('${key}',${floor})">${row.area.min}〜${row.area.max}Fの出撃準備へ</button>`:`<p>${floor}F到達後に出撃準備へ</p>`;}).join('');}
function planMaterialExploration(key,floor){
 if(state.screen!=='town'||floor>state.deepestFloorReached||!materialSources(key).some(row=>row.floors.includes(floor)))return;
 const start=unlockedWarpFloors().filter(f=>f<=floor).at(-1);if(!start)return;
 selectStartFloor(start);openLobbyFacility('town-expedition');
 document.getElementById('lobby-facility-content')?.insertAdjacentHTML('afterbegin',`<p>素材の目的地：${floor}F方面 / 出発：${start}F。未解放地点へのワープは行いません。</p>`);
}
const BUILD_GUIDES={
 lifesteal:'与えたダメージの一部でHPを回復する継戦型。ボスでは回復効率が落ちます。',
 bleed:'命中を重ねて出血を蓄積。継続ダメージと出血中の敵への補助効果を狙います。',
 poison:'毒を付与して長期戦で削る型。ボスへの毒ダメージには低い上限があります。',
 fire:'炎上を重ねて継続ダメージを狙う型。状態異常蓄積や連撃と組み合わせます。',
 freeze:'凍結で敵行動を時々妨害し、会心や追撃へつなぎます。必ず行動を止める効果ではありません。',
 shock:'感電した敵への攻撃や追加攻撃を強化。感電の付与と命中を重ねます。',
 curse:'呪いを積み、敵からのダメージを軽減。状態異常特攻と合わせて攻守を補います。',
 crit:'会心の発生率を伸ばす型。凍結や会心時効果と組み合わせます。',
 multiHit:'一定の命中数で追加ダメージを与えます。行動を重ねる戦い方に向きます。',
 singleStrike:'命中数の周期に合わせた強攻撃を伸ばします。常時すべての攻撃が強くなるわけではありません。',
 lowHp:'HPが低い時に攻撃を強化する背水型。回復手段と敵の大技への備えが必要です。',
 highHp:'高いHPを維持して攻撃を強化。回復・シールドと組み合わせます。',
 shield:'障壁で被ダメージを吸収。初回被弾時の付与と余剰回復を活かします。',
 guard:'防御中の被ダメージを抑える型。防御後の反撃や回復と組み合わせます。',
 justGuard:'敵の大技に合わせた防御を狙います。成功後の次撃強化を活かしましょう。',
 counter:'ガードで反撃を準備し、次の攻撃を強化。防御だけで完結する効果ではありません。',
 reflect:'受けたダメージの一部を敵へ返す型。反射には上限があり、敵HPを1残します。',
 dodge:'被弾を回避する確率を上げます。回避後の攻撃補助と好相性ですが確実ではありません。',
 break:'破壊可能な部位を狙い、敵の弱体化と素材抽選補助を得ます。破壊しても素材は確定ではありません。',
 boss:'ボス相手の攻撃を強化。通常敵にはこの特攻が働きません。',
 mob:'通常敵・エリート向けの攻撃補助。連戦で素材を集める時に向きます。',
 status:'状態異常を付与しやすくする型。状態異常特攻と組み合わせると効果的です。',
 statusHunter:'状態異常中の敵への攻撃を伸ばします。先に状態異常を付与する手段が必要です。',
 conversion:'炎上を感電へ変換する型。炎上の付与手段がないと変換できません。',
 hybrid:'複数の状態異常を利用して追加ダメージを伸ばす型。異なる状態を組み合わせます。',
 normalAttack:'通常攻撃を強化。スキル待ちの間も安定して攻撃できます。',
 heavyAttack:'強攻撃の威力を伸ばす型。通常攻撃やスキルとは用途が異なります。',
 skillPower:'スキルの火力を強化。スキル回転や分身と組み合わせます。',
 skillHaste:'スキルの再使用待ちを短縮。待ち時間の下限は残ります。',
 onKill:'撃破時の回復や次の戦闘への攻撃補助。敵を倒し続ける探索に向きます。',
 longFight:'ターンが経過してから攻撃を強化。短期戦では本領を発揮しにくい型です。',
 burst:'戦闘開始直後の火力を重視。長期戦では開幕補助が終了します。',
 overheal:'吸血の余剰回復を障壁へ変換。HP満タンと吸血手段が必要で、障壁には上限があります。',
 onHurt:'その戦闘で被弾した後の攻撃を強化。被ダメージ自体を無効にはしません。',
 unhurt:'被弾していない間の攻撃を強化。回避やHP維持を組み合わせます。',
 pierce:'敵DEFに応じて攻撃を補助する型。完全な防御無視ではありません。',
 defDown:'命中で敵DEFを削る型。繰り返し攻撃する戦い方に向き、DEFは0未満になりません。',
 speed:'2命中ごとの追加ダメージで手数を表現。行動間隔そのものは変わりません。',
 extraAttack:'確率で追加ダメージを与えます。感電と好相性で、追加攻撃は再帰しません。',
 followUp:'状態異常中の敵への命中から追撃を予約。状態異常の付与手段と組み合わせます。',
 summon:'命中周期で分身が攻撃。召喚獣の派遣機能とは別の戦闘効果です。',
 farming:'素材抽選へ補助を加える探索向けの型。未解禁素材は出ず、確定入手にもなりません。',
 rareMaterial:'希少素材の抽選を補助。解禁条件と確率上限は維持されます。',
 chest:'宝箱・採取などの素材報酬品質を補助。装備本体を直接出す効果ではありません。',
 safe:'戦闘での被ダメージを少し軽減。探索イベントの直接HP減少は対象外です。',
 deep:'61F以降の攻撃を強化する深層向け。序盤では主効果が働きません。',
 abyssal:'500F以降が主効果の対象。現行200F以内では主効果未解禁です。'
};
const COMPLETED_GUIDES={
 bloodPact:['出血した敵からHPを奪う継戦型','連戦・回復','ボスでは吸血抑制','出血を付与して攻撃',4,3,4],
 bastion:['大技を受け止めて次撃で反撃','防御','JUSTのタイミングが必要','大技に防御、その後攻撃',2,3,4],
 corrosion:['毒を維持して長く削る','長期戦・状態異常','短期戦と毒上限付きボス','毒を付与して維持',4,3,3],
 iceTomb:['凍結付与後の次撃を会心と氷追撃で強化','状態異常','凍結付与が必要','凍結付与後に直接攻撃',3,3,3],
 dismantler:['強攻撃で部位を壊し素材を狙う','部位破壊・素材集め','部位のない敵','部位選択して強攻撃',4,4,2],
 thunderChain:['感電と周期追加攻撃で手数を伸ばす','連戦','追加攻撃には上限','感電を付与して命中を重ねる',4,4,2],
 shadowArmy:['分身とスキルから追撃を狙う','長期戦','命中周期が必要','スキルと直接攻撃を交互に',3,4,2],
 untouched:['無傷と高HPを維持して攻撃する','防御・短期戦','被弾すると無傷条件終了','危険な攻撃を防ぎHP維持',2,4,4],
 bloodFury:['低HPで会心と吸血を狙う背水型','高難度','低HPで倒される危険','敵の大技前はHPを確保',2,4,3],
 deepHunter:['深層ボスの部位を狙う','ボス・部位破壊','浅い階層で主効果なし','61F以降で部位攻撃',3,4,2],
 embers:['命中を重ね炎上を蓄積する','状態異常','付与まで時間が必要','通常攻撃を重ねる',4,3,2],
 hexJudge:['呪い付与後の次撃で敵DEFを崩す','状態異常・長期戦','呪い付与が必要','呪いを付与して直接攻撃',3,3,3],
 shelter:['余剰吸血を障壁と次撃へ変える','回復・防御','満タンHPと吸血が必要','HPを維持し攻撃を続ける',3,2,5],
 avenger:['被弾後の反射と攻撃で取り返す','防御','反射に上限・反射だけで倒せない','防御後に攻撃',4,3,4],
 execution:['周期強攻撃で硬い敵を断つ','ボス・長期戦','強攻撃の周期依存','命中数に合わせて強攻撃',3,5,2],
 spellCycle:['スキルと通常攻撃を循環させる','連戦','スキル待ち時間は残る','スキル後に通常攻撃',4,4,2],
 chainHunter:['撃破回復を利用して連戦する','雑魚・連戦','単独ボスでは撃破補助が遅い','通常攻撃で敵を倒し続ける',5,3,4],
 firstLight:['開幕2行動に火力を集中する','短期戦','3行動目以降は開幕補助終了','最初の2行動で強攻撃',4,5,2],
 alchemist:['炎上の一部を感電へつなぐ','状態異常','炎上付与が必要','炎上している敵へ命中',3,3,2],
 plague:['未付与状態を増やし複合効果を狙う','状態異常・長期戦','短期戦では状態が揃いにくい','直接攻撃を3命中ずつ重ねる',3,4,3],
 caravan:['被ダメージを抑え素材報酬を狙う','素材集め・防御','火力を直接伸ばしにくい','素材を集め安全に帰還',5,2,4],
 prospector:['部位破壊と希少素材抽選を両立','素材集め・部位破壊','素材は確定ではない','素材に対応する部位を狙う',4,2,2],
 endurance:['初回障壁から長期戦へつなぐ','長期戦・防御','開幕火力が低め','大技を防ぎ戦闘を維持',4,3,4],
 windChase:['回避後の攻撃と周期追加を狙う','連戦','回避・追加攻撃は確率依存','回避後も命中を重ねる',3,4,3],
 abyssCovenant:['深層の状態異常特攻を伸ばす','深層','500Fまで主効果未解禁','500F実装後に再評価',2,3,2]
};
function buildGuideHtml(b){const g=COMPLETED_GUIDES[b.id];if(!g)return '';const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);return `<p>${g[0]}</p><small>${g[1]} / 初心者向け目安（Tierではありません）</small><p>扱いやすさ ${stars(g[4])}<br>火力 ${stars(g[5])} / 耐久 ${stars(g[6])}</p><p>弱点：${g[2]}<br>おすすめ行動：${g[3]}</p>`;}
function weaponPlayHtml(r){const tags=[...buildTags({item:r})];return `<p>戦い方：${uiEscape(BUILD_GUIDES[r.primaryBuildTag]||'個別の装備効果を確認してください。')}</p>${r.weaponType?`<p>${WEAPON_TYPES[r.weaponType]?.name||'武器'}：${uiEscape(BUILD_GUIDES[WEAPON_TYPES[r.weaponType]?.build]||'個別効果で用途が変わります。')}</p>`:''}<details><summary>主・副ビルドの説明</summary>${tags.map(t=>`<p><b>${BUILD_CATALOG[t]}</b>：${BUILD_GUIDES[t]||''}</p>`).join('')}</details>`;}
function normalizeWeaponGoals(){
 const p=forgeProgress();if(!p.weaponGoals||typeof p.weaponGoals!=='object'||Array.isArray(p.weaponGoals))p.weaponGoals={};
 for(const [actor,id]of Object.entries(p.weaponGoals))if(!['player','elna'].includes(actor)||typeof id!=='string'||CRAFT_RECIPES[id]?.type!=='weapon')delete p.weaponGoals[actor];
 return p.weaponGoals;
}
function setWeaponGoal(id,actor=forgeFilters.character){if(!['player','elna'].includes(actor)||id&&(!forgeRecipeRevealed(id)||CRAFT_RECIPES[id]?.type!=='weapon'))return;const goals=normalizeWeaponGoals();if(id)goals[actor]=id;else delete goals[actor];saveState();if(id)openWeaponTree(id);else openCrafting();syncLobbyScreen();}
function weaponDescendants(id){const out=[],seen=new Set();function visit(key){if(seen.has(key))return;seen.add(key);out.push(key);if(!forgeRecipeRevealed(key))return;(FORGE_CHILDREN[key]||[]).forEach(n=>visit(n.id));}visit(id);return out;}
function weaponBuildFutures(id){const tags=new Set(weaponDescendants(id).filter(forgeRecipeRevealed).flatMap(key=>[...buildTags({item:CRAFT_RECIPES[key]})]));return completedBuildState(characterEquipment(forgeFilters.character)).filter(b=>b.requiredTags.some(t=>tags.has(t)));}
function forgeQuickCompare(actor,slot,item){const slots=characterEquipment(actor),stats=s=>actor==='player'?getPlayerStats(s):companionStats(actor,s),a=stats(slots),b=stats({...slots,[slot]:item});return `<div class="forge-quick-compare">${[['atk','ATK'],['def','DEF'],['maxHp','HP']].filter(([k])=>b[k]!==a[k]).map(([k,label])=>`<span class="${b[k]>a[k]?'up':'down'}">${label} ${b[k]-a[k]>0?'+':''}${b[k]-a[k]}</span>`).join('')}</div>`;}
function forgeNextPreview(id){
 const rows=FORGE_CHILDREN[id]||[],visible=rows.filter(n=>forgeRecipeRevealed(n.id)).slice(0,2);
 return `<div class="forge-next-preview"><b>次の派生：</b>${visible.map(n=>`<span>${uiEscape(n.r.name)} <small>（${uiEscape([n.r.primaryBuildTag,...(n.r.secondaryBuildTags||[])].slice(0,2).map(t=>BUILD_CATALOG[t]).filter(Boolean).join(' / '))}）</small></span>`).join('')|| (rows.length?'？？？（未解禁）':'登録なし')}</div>`;
}
function forgeMissingSources(r,id){
 const missing=Object.entries(r.materials).filter(([key,n])=>materialCount(key)<n);
 return `<div class="forge-missing-sources">${missing.map(([key,n])=>{
  const source=materialSources(key).find(s=>s.drop)||materialSources(key)[0],floor=source?.floors[0],seen=materialKnown(key)&&source&&state.codex.enemies[source.enemy.name];
  return `<section><b class="forge-missing">不足：${materialKnown(key)?uiEscape(MATERIALS[key]?.name||key):'？？？'} ×${n-materialCount(key)}</b>${source?`<div>入手：${source.area.min}〜${source.area.max}F / ${source.drop?(seen?uiEscape(source.enemy.name):'？？？'):'宝箱'}</div>${state.screen==='town'&&floor<=state.deepestFloorReached?`<button class="btn btn-sub" onclick="planMaterialExploration('${key}',${floor})">${source.area.min}〜${source.area.max}Fの出撃準備へ</button>`:'<small>到達後に出撃準備へ</small>'}`:'<div>入手先未登録</div>'}<details><summary>所持数・素材詳細</summary><p>所持 ${materialCount(key)} / 必要 ${n}</p><button class="btn btn-sub" onclick="openMaterialDetail('${key}','${id}')">確率・全用途を見る</button></details></section>`;
 }).join('')}</div>`;
}
function weaponFuturesHtml(id){return `<details><summary>この武器・派生先から狙える完成ビルド（防具・アクセも必要）</summary>${weaponBuildFutures(id).map(b=>`<p><button class="btn btn-sub" onclick="openCompletedBuilds('${forgeFilters.character}','${b.id}')">《${b.name}》</button><br>${COMPLETED_GUIDES[b.id][0]}<br>所持候補 ${ownedBuildProgress(b)}/${b.requiredTags.length}タグ（他キャラ装備中は除外・構成確認が必要）<br>現在装備 ${b.requiredTags.length-b.missing.length}/${b.requiredTags.length}タグ / 不足 ${b.missing.map(t=>BUILD_CATALOG[t]).join('・')||'なし'}${b.missingRoles.length?' / 武器・防具・アクセの構成も確認':''}</p>`).join('')}</details>`;}
function weaponTargetHtml(actor=forgeFilters.character){const id=normalizeWeaponGoals()[actor],r=CRAFT_RECIPES[id];if(!r)return '';return `<details class="forge-target"><summary>製作目標</summary><b>${actor==='elna'?'エルナ':'主人公'}の目標：${forgeRecipeRevealed(id)?uiEscape(r.name):'？？？'}</b>${forgeRecipeRevealed(id)?forgeMaterialHtml(r):''}<button class="btn btn-sub" onclick="openWeaponTree('${id}')">目標の派生を見る</button><button class="btn btn-sub" onclick="setWeaponGoal(null,'${actor}')">目標解除</button></details>`;}
function nextWeaponHtml(id){const rows=(FORGE_CHILDREN[id]||[]);return `<details><summary>作成後の次の派生：${rows.length}件</summary>${rows.map(n=>forgeRecipeRevealed(n.id)?`<p>${n.r.awakening?'覚醒':'派生'}：${uiEscape(n.r.name)}<br>${BUILD_GUIDES[n.r.primaryBuildTag]}<br>${Object.entries(n.r.materials).map(([k,v])=>`${materialKnown(k)?uiEscape(MATERIALS[k]?.name):'？？？'} ×${v}`).join(' / ')}</p>`:'<p>？？？：隠し派生あり</p>').join('')||'<p>登録済みの次の派生はありません。</p>'}</details>`;}
function showCraftSuccess(item,actor){showChapterModal('作成しました',`<h3>${uiEscape(item.name)}</h3>${nextWeaponHtml(item.key)}`,`<button class="btn btn-gold" onclick="openCraftedEquipment('${item.id}','${actor}')">装備する</button>${item.type==='weapon'?`<button class="btn btn-sub" onclick="openWeaponTree('${item.key}')">派生を見る</button>`:''}<button class="btn btn-sub" onclick="openCrafting()">鍛冶場へ戻る</button>`);}
function openCraftedEquipment(itemId,actor){const item=forgeOwnership().find(i=>i.id===itemId);if(!item)return;openCharacterEquipment(actor,equipmentSlot(item));openEquipmentCandidate(itemId);}
function forgeLearningDetail(id){const r=CRAFT_RECIPES[id];if(!r||!forgeRecipeRevealed(id))return '';const current=forgeBuildOverview().primary,tags=buildTags({item:r}),aligned=!current.length||current.some(t=>tags.has(t));return `${weaponPlayHtml(r)}${aligned?'':'<p class="forge-missing">現在の主ビルドとは相性が低い候補です。作成は可能です。</p>'}${r.type==='weapon'?weaponMiniTreeHtml(id)+weaponFuturesHtml(id)+`<button class="btn btn-sub" onclick="setWeaponGoal('${id}')">この武器を目標にする</button>`+nextWeaponHtml(id):''}`;}
function weaponMiniTreeHtml(id){const r=CRAFT_RECIPES[id],keys=[r.parent,id,...(FORGE_CHILDREN[id]||[]).map(n=>n.id)].filter(Boolean);return `<h3>派生ルート</h3><div class="forge-tree-track">${keys.map(key=>`<section class="forge-tree-node ${key===id?'current':''}">${forgeRecipeRevealed(key)?`<button class="btn btn-sub" onclick="openWeaponTree('${key}')">${key===id?'現在：':key===r.parent?'← 派生元：':'派生先 → '}${uiEscape(CRAFT_RECIPES[key].name)}</button><p>${BUILD_GUIDES[CRAFT_RECIPES[key].primaryBuildTag]}</p>`:'？？？（隠し派生）'}</section>`).join('')}</div>`;}
function lobbyWeaponGoalText(){const goals=normalizeWeaponGoals(),id=goals.player||goals.elna,r=CRAFT_RECIPES[id];return r?'製作目標：'+(forgeRecipeRevealed(id)?r.name:'？？？'):'';}
let buildDiscoveryInitialized=false;
function syncBuildDiscoveries(){
 if(state.screen!=='town')return;
 const p=forgeProgress();if(!p.buildDiscoveries||typeof p.buildDiscoveries!=='object')p.buildDiscoveries={};
 const found=[];
 for(const actor of ['player',...(state.chapter.owned.elna?['elna']:[])])for(const b of completedBuildState(characterEquipment(actor)).filter(b=>b.active)){
  const key=actor+':'+b.id;if(p.buildDiscoveries[key])continue;p.buildDiscoveries[key]=true;if(buildDiscoveryInitialized)found.push(combatName(actor)+'：《'+b.name+'》完成！\n'+COMPLETED_GUIDES[b.id][0]);
 }
 buildDiscoveryInitialized=true;
 if(found.length){const toast=document.createElement('div');toast.className='level-up-toast';toast.setAttribute('role','status');toast.textContent=found.slice(0,2).join('\n');document.body.append(toast);setTimeout(()=>toast.remove(),2400);saveState();}
}
