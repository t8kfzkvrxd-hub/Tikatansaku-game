function synergyRuleText(rule){
 let [label,unit]=SYNERGY_STAT_TEXT[rule.stat]||[rule.stat,''];let condition=SYNERGY_CONDITION_TEXT[rule.condition]||rule.condition;
 if(rule.stat==='statusCap'&&rule.primary==='poison'){label='毒延長時の残りターン上限';unit='T';}
 if(rule.condition==='always')condition={kill:'敵撃破時（次撃補助は次戦まで保持）',leech:'吸血時',reflect:'被弾の反射時',effects:'装備中・既存素材抽選時',dodge:'回避成功時',incoming:'被弾時',hit:'主攻撃命中時',attack:'攻撃時',part:'部位命中時',heal:'吸血回復時'}[rule.trigger]||condition;
 if(rule.condition==='low')condition=`HP${rule.strict?25:50}%以下`;
 if(rule.condition==='high')condition=`HP${rule.strict?100:90}%以上`;
 if(rule.condition==='long')condition=`${rule.strict?6:4}ターン経過`;
 if(['bleed','curse'].includes(rule.condition))condition+=`（${rule.strict?3:1}以上）`;
 if(rule.condition==='multipleStatuses')condition=`状態異常${rule.strict?3:2}種類以上`;
 return `${condition} → ${label} +${rule.value}${unit}${rule.stat==='statusCap'?'（対象：'+BUILD_CATALOG[rule.primary]+'）':''}${rule.consumeStatus?'・発動後に対象蓄積2消費（毒は残り1T消費）':''}`;
}
function synergyItemHtml(item){
 const spec=itemSynergy(item);if(!spec)return '';
 return `<details class="synergy-details"><summary>単品シナジー：${uiEscape(BUILD_CATALOG[spec.primary])}</summary><p>既存タグの核効果＋以下の条件付き補助。装備1点から条件判定します。</p><ul>${spec.rules.map(r=>`<li>${uiEscape(synergyRuleText(r))}</li>`).join('')}</ul><small>同種補助は全装備・完成ビルドで共通上限。派生段階 ${spec.step}。数値は基本性能・既存効果とは別枠です。</small></details>`;
}
function completedBuildSummary(id){
 const slots=characterEquipment(id);if(!slots)return '';const states=completedBuildState(slots),active=states.filter(b=>b.active),locked=states.filter(b=>b.configured&&b.locked);
 return `<div class="completed-build-summary"><button class="btn btn-sub" onclick="openCompletedBuilds('${id}')">完成ビルド ${active.length}件${locked.length?' / 主効果未解禁 '+locked.length+'件':''} · 詳細／不足タグ</button><small>${active.length?active.slice(0,3).map(b=>'《'+b.name+'》').join(' ')+(active.length>3?' 他'+(active.length-3)+'件':''):'未完成：武器・防具・アクセと必要タグを組み合わせる'}</small></div>`;
}
function openCompletedBuilds(id='player',buildId=null){
 const slots=characterEquipment(id);if(!slots)return;
 const states=completedBuildState(slots),tags=buildTags(slots),list=buildId?states.filter(b=>b.id===buildId):states.slice().sort((a,b)=>Number(b.active)-Number(a.active)||a.missing.length-b.missing.length);
 const names={weapon:'武器',armor:'防具',accessory:'アクセサリー'};
 showChapterModal(`${combatName(id)}：完成ビルド`,`${renderCharacterSD(id,{size:'small',selected:true})}<p>武器・防具・アクセを各1点以上装備し、必要タグを全て満たすと完成。同タグは1回扱い。完成していても効果は記載条件でのみ発動します。</p><div class="completed-build-list">${list.map(b=>`<section><button class="btn ${b.active?'btn-gold':'btn-sub'}" aria-label="${b.name}の詳細" onclick="openCompletedBuilds('${id}','${b.id}')">${b.configured&&b.locked?'構成完成 / 主効果未解禁（'+b.unlockFloor+'F以降）':b.active?'✓ 完成':'未完成'} 《${b.name}》</button><p>必要：${b.requiredTags.map(t=>`${tags.has(t)?'✓':'−'} ${BUILD_CATALOG[t]}`).join(' / ')}</p>${b.missing.length?`<p>不足タグ：${b.missing.map(t=>BUILD_CATALOG[t]).join(' / ')}</p>`:''}${b.missingRoles.length?`<p>不足部位：${b.missingRoles.map(t=>names[t]).join(' / ')}</p>`:''}${buildId||b.active?`<ul>${b.rules.map(r=>`<li>${uiEscape(synergyRuleText(r))}</li>`).join('')}</ul>`:''}</section>`).join('')}</div><details class="synergy-details"><summary>重複・安全上限</summary><p>新補助：攻撃+35%、会心+20pt、軽減15%、部位補正+25%、吸血+5ptまで。既存タグとの攻撃補正合計+100%、吸血25%・1回最大HP8%・ボス抑制、障壁最大HP15%、反射20ダメージを維持。追加ダメージは主命中からのみ、追加攻撃自身は再抽選しません。</p></details>`,`<button class="btn btn-sub" onclick="${buildId?`openCompletedBuilds('${id}')`:`openCharacterEquipment('${id}')`}">戻る</button><button class="btn btn-sub" onclick="closeGenericModal()">閉じる</button>`);
 document.querySelector("#modal-layer .update-notes-card")?.classList.add("synergy-modal");
}
