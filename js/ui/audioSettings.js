// UI preferences only. Never included in the game save or modified by save migration.
const AUDIO_SETTINGS_KEY='ABYSS_ROGUE_AUDIO_SETTINGS_V1';
const AUDIO_DEFAULTS=Object.freeze({mute:false,bgmVolume:0.35,seVolume:1});
function audioVolume(value,fallback){return typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;}
function readAudioSettings(){
 let value;try{value=JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY));}catch(_){value=null;}
 if(!value||typeof value!=='object'||Array.isArray(value))value={};
 return {mute:typeof value.mute==='boolean'?value.mute:AUDIO_DEFAULTS.mute,bgmVolume:audioVolume(value.bgmVolume,AUDIO_DEFAULTS.bgmVolume),seVolume:audioVolume(value.seVolume,AUDIO_DEFAULTS.seVolume)};
}
const audioSettings=readAudioSettings();
function setAudioSettings(patch){
 if(Object.prototype.hasOwnProperty.call(patch,'mute'))audioSettings.mute=typeof patch.mute==='boolean'?patch.mute:AUDIO_DEFAULTS.mute;
 for(const key of ['bgmVolume','seVolume'])if(Object.prototype.hasOwnProperty.call(patch,key))audioSettings[key]=audioVolume(patch[key],AUDIO_DEFAULTS[key]);
 try{localStorage.setItem(AUDIO_SETTINGS_KEY,JSON.stringify(audioSettings));}catch(_){/* Private/blocked storage: keep working in this session. */}
 applyAudioSettings();
}
function setMasterMute(value){setAudioSettings({mute:value});}
function setBgmVolume(value){setAudioSettings({bgmVolume:value});}
function setSeVolume(value){setAudioSettings({seVolume:value});}
