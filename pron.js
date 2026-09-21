// Shared helpers: British voice choice, pronunciation fixes, UK/US spelling tolerance.

// Spoken forms for abbreviations and words that speech engines often get wrong.
// Key = lowercase word, value = how it is said. Add your own lines if you hear a mistake.
const SAY = {
  "mba":"M B A","mbbs":"M B B S","it":"I T","pg":"P G","ug":"U G","pc":"P C","upi":"U P I","usa":"U S A","tv":"T V",
  "paytm":"pay T M","mastercard":"master card","cheque":"check","sars":"sars",
  "tai-chi":"tie chee","cetacean":"sih tay shun","phylum":"fy lum","genus":"jee nus","abseiling":"ab sail ing",
  "spelunking":"spih lunk ing","orienteering":"or ee en teer ing","anaesthetist":"uh nees thuh tist",
  "maisonette":"may zuh net","registrar's":"rej is trars","tsunami":"tsoo nah mee","dinghy":"ding ee",
  "yoghurt":"yog urt","beige":"bayzh","mauve":"mohv","cyan":"sigh an","malayalam":"mal uh yah lum",
  "telugu":"tel uh goo","rajasthani":"rah juh stah nee","marathi":"muh rah tee","punjabi":"pun jah bee",
  "bengali":"ben gaw lee","carcinogen":"car sin uh jen","biopsy":"by op see","hypotension":"hi poh ten shun",
  "zimbabwe":"zim bah bway","dubai":"doo by","wednesday":"wenz day","alumni":"uh lum nigh","alumnus":"uh lum nus",
  "menial":"mee nee ul","exchequer":"ex chek er","atheneum":"ath uh nee um","hearthstone":"harth stone",
  "auburn":"aw burn","verdure":"vur jer","polygon":"pol ee gon","fortnight":"fort night"
};
function say(text){
  const whole = text.toLowerCase().replace(/’/g,"'");
  if (SAY[whole]) return SAY[whole];
  return text.replace(/[A-Za-z][A-Za-z'’-]*/g, w => SAY[w.toLowerCase().replace(/’/g,"'")] || w).replace(/\//g," or ");
}

// Pick the most natural-sounding British voice available on this device.
function pickGB(voices){
  const score = v => (/natural|online/i.test(v.name)?3:0) + (/google uk/i.test(v.name)?2:0) + (/sonia|libby|ryan|hazel|george|daniel|serena|kate/i.test(v.name)?1:0);
  return voices.filter(v=>/en[-_]GB/i.test(v.lang)).sort((a,b)=>score(b)-score(a))[0];
}

// Treat UK and US spellings as the same word when marking answers.
const CANON = [[/colou?r/g,"color"],[/neighbour/g,"neighbor"],[/centre/g,"center"],[/licen[cs]e/g,"license"],[/fibre/g,"fiber"],
  [/aluminium/g,"aluminum"],[/catalogue/g,"catalog"],[/theatre/g,"theater"],[/fertiliser/g,"fertilizer"],[/snorkell/g,"snorkel"],
  [/yoghurt/g,"yogurt"],[/grey/g,"gray"],[/storey/g,"story"],[/fulfilment/g,"fulfillment"],[/enrolment/g,"enrollment"],
  [/anaes/g,"anes"],[/monetisation/g,"monetization"],[/programme/g,"program"]];
const canon = s => CANON.reduce((t,[a,b])=>t.replace(a,b), s);
