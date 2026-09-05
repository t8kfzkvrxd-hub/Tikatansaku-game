const ELNA_FACE_CONFIG=Object.freeze({
  base:'../assets/characters/elna/base/elna-reference.png',
  width:1024,height:1536,
  leftEye:null,rightEye:null,leftEyebrow:null,rightEyebrow:null,mouth:null,
  capabilities:Object.freeze({blink:false,talking:false,gaze:false,expressions:['normal']}),
  unavailable:Object.freeze({
    blink:'右閉じ目がなく、基準の目を安全に隠すマスクも未確定です。',
    talking:'元の口を二重表示なく隠せる正式素材が未確定です。',
    expression:'基準に適合する顔差分と局所マスクが未確定です。',
    gaze:'基準に適合する左右視線素材がありません。'
  })
});
