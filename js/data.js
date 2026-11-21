// Static content: default schedule, worship steps, precepts, rubric, places.
// Personal schedules are imported from Google Calendar and kept in the user's Drive, never here.

export const GCOL = {'1':'#7986cb','2':'#33b679','3':'#8e24aa','4':'#e67c73','5':'#f6bf26','6':'#f4511e','7':'#039be5','8':'#616161','9':'#3f51b5','10':'#0b8043','11':'#d50000'};
export const GNAME = {'1':'Lavender','2':'Sage','3':'Grape','4':'Flamingo','5':'Banana','6':'Tangerine','7':'Peacock','8':'Graphite','9':'Blueberry','10':'Basil','11':'Tomato'};
export const WSTEPS = ['Buddha Upasthana','Buddhapooja','Brahmaboothan Athithulan','Sabba Papassa Akaranang','Buddha Vandana','Jayo Munindassa Subhodhi Moole','Mora Piritha'];
export const STUPA = { name: 'Ruwanwelisaya', lat: 8.3503, lon: 80.3961 };

const B = (k, t, m, title, c, o = {}) => ({ k, t, m, title, c, ...o });
// A complete Theravāda day, offered as a starting template. Import your own from Calendar in Settings.
export const DEFAULT_SCHEDULE = [
  B('pansil','03:00',15,'🌠 Pansil 🌌','5',{a:1,d:'The five precepts. On uposatha days the app offers eight, nine or ten.'}),
  B('kasina1','03:30',10,'🔥 Kasina I','11',{tool:'timer',d:'Kasina, first session. Note the sign in the kasina log.'}),
  B('maithree1','04:00',10,'🪷 Maithree I','4',{tool:'timer',d:'Mettā, first session.'}),
  B('karaneeya','04:30',30,'📿 Karaneeya Metta 21','4',{tool:'counter',n:21,d:'Karaṇīya Metta Sutta, 21 recitations.'}),
  B('asubha','05:00',15,'🍂 Asubha I · Body contemplation','10',{tool:'timer',d:'The 32 parts on your own body first (MN 10), then the four elements.\nOut and about: only when lust arises, then turn to mettā.\nIf it leaves you low, switch to mettā or ānāpāna (SN 54.9).'}),
  B('morning','06:00',30,'🪔 Morning Worship','6',{a:1,steps:'I',d:'Seven steps, each ticked. The block greys when all seven are done.'}),
  B('checkin1','06:30',10,'🧭 Check-in I · Set the course','2',{a:1,ci:1,d:'The five reflections (AN 5.57): I will age. I will fall ill. I will die. I will be parted from all I love. I am the heir to my actions.\nThen one intention each: body, a kind act; speech, a pause before a charged reply; mind, one pattern to watch.'}),
  B('lookfwd','06:40',15,'🌅 Look forward · Week begins','2',{a:1,dow:[1],ci:4,d:'Choose what to hold this week from the Rubric. Note the uposathas ahead and which precept set you will take.'}),
  B('jolt','06:40',15,'⚡ Midweek jolt','2',{a:1,dow:[3],ci:5,d:'What is holding, what is slipping? Recommit for the days left.'}),
  B('sakman1','07:00',30,'👣 Sakman I','10',{tool:'timer',d:'Walking meditation, 15–30 min. Lifting, moving, placing.'}),
  B('anapana1','08:00',10,'🌬️ Anapanasati I','7',{tool:'timer',d:'Main subject. When the day allows, let one session run long (30+ min).'}),
  B('kasina2','11:00',10,'🔥 Kasina II','11',{tool:'timer'}),
  B('checkin2','12:30',30,'🧭 Check-in II · Walk the course','2',{a:1,ci:2,tool:'timer',d:'Sakman II with death recollection: each step could be the last.\nSlope check (MN 19): has the mind leaned toward renunciation, goodwill and harmlessness since morning, or away?'}),
  B('anapana2','13:30',10,'🌬️ Anapanasati II','7',{tool:'timer'}),
  B('kasina3','16:30',10,'🔥 Kasina III','11',{tool:'timer'}),
  B('sakman3','17:00',30,'👣 Sakman III','10',{tool:'timer'}),
  B('reading','17:30',30,'📖 Dharma Reading','9',{d:'Afterwards, five minutes: how does this apply to me today?'}),
  B('evening','18:00',30,'🪔 Evening Worship','6',{a:1,steps:'II',d:'Seven steps, each ticked.'}),
  B('listening','18:30',30,'🎧 Dharma Listening','9',{d:'Taking notes? Open a sermon note in the pin potha.'}),
  B('maithree2','19:00',10,'🪷 Maithree II','4',{tool:'timer'}),
  B('buddhanussati','19:15',15,'☸️ Buddhanussati','6',{tool:'counter',n:21,d:'Recollection of the Buddha, 21 rounds.'}),
  B('anapana3','19:30',10,'🌬️ Anapanasati III','7',{tool:'timer',d:'Close with the fourth tetrad (MN 118): impermanence, fading, cessation, letting go.'}),
  B('checkin3','20:00',20,'🧭 Check-in III · Review the course','2',{a:1,ci:3,d:'The mirror (MN 61): body, speech, mind. Disclose and resolve a wrong deed or word; recoil, resolve and release a wrong thought; be glad for what went well.\nMN 36: did pleasure take me over today? Did pain?'}),
  B('lookback','20:20',10,'🌙 Look back · Week complete','2',{a:1,dow:[0],ci:6,d:'Read back the week. Ask Claude for the weekly reflection.'}),
  B('maranussati','21:45',10,'🕯️ Maranussati I','1',{tool:'timer',d:'AN 6.20: many things could end my life tonight. What unwholesome quality is not yet abandoned?'}),
  B('vandana3','22:30',10,'🙏 Buddha Vandana III · Ruwanwelisaya','6',{a:1,tool:'compass',d:'Seven full prostrations, facing Ruwanwelisaya, wherever you are.'}),
  B('maithree3','23:00',10,'🪷 Maithree III','4',{tool:'timer',d:'Ideally lying down as you fall asleep (AN 11.15).'}),
];

export const FAMILIES = {
  precepts:['Precepts','#f6bf26'], worship:['Worship','#f4511e'], metta:['Mettā','#e67c73'], anapana:['Ānāpāna','#039be5'],
  kasina:['Kasina','#d50000'], body:['Body & walking','#0b8043'], death:['Maraṇasati','#7986cb'], dhamma:['Dhamma','#3f51b5'],
  personal:['Personal','#8e24aa'], checkin:['Check-ins','#33b679'] };
export function familyOf(b) {
  const t = (b.title || '').toLowerCase();
  if (/pansil|precept|sil\b/.test(t)) return 'precepts';
  if (/worship|vandana|buddhanussati|pooja|pūjā/.test(t)) return 'worship';
  if (/maithree|mett|karaneeya|karaṇīya/.test(t)) return 'metta';
  if (/anapana|ānāpāna/.test(t)) return 'anapana';
  if (/kasina/.test(t)) return 'kasina';
  if (/sakman|asubha|walking|body/.test(t)) return 'body';
  if (/maran|maraṇ|death/.test(t)) return 'death';
  if (/dharma|dhamma|reading|listening|bana/.test(t)) return 'dhamma';
  if (/check-in|look back|look forward|jolt/.test(t)) return 'checkin';
  return 'personal';
}
export const displayName = t => String(t || '').replace(/^[^\p{L}\d]+/u, '').replace(/\s*[^\p{L}\d)]+$/u, '').trim();

// Uposatha precepts
const P = [
  ['Not killing','Pāṇātipātā veramaṇī sikkhāpadaṃ samādiyāmi'],
  ['Not taking what is not given','Adinnādānā veramaṇī sikkhāpadaṃ samādiyāmi'],
  ['Celibacy','Abrahmacariyā veramaṇī sikkhāpadaṃ samādiyāmi'],
  ['Not lying','Musāvādā veramaṇī sikkhāpadaṃ samādiyāmi'],
  ['No intoxicants','Surāmerayamajjapamādaṭṭhānā veramaṇī sikkhāpadaṃ samādiyāmi'],
  ['No food after noon','Vikālabhojanā veramaṇī sikkhāpadaṃ samādiyāmi']];
const P7 = ['No entertainment, garlands, scents or adornment','Nacca-gīta-vādita-visūkadassana-mālā-gandha-vilepana-dhāraṇa-maṇḍana-vibhūsanaṭṭhānā veramaṇī sikkhāpadaṃ samādiyāmi'];
const P7a = ['No dancing, singing, music or shows','Nacca-gīta-vādita-visūkadassanā veramaṇī sikkhāpadaṃ samādiyāmi'];
const P7b = ['No garlands, scents, ointments or adornment','Mālā-gandha-vilepana-dhāraṇa-maṇḍana-vibhūsanaṭṭhānā veramaṇī sikkhāpadaṃ samādiyāmi'];
const P8 = ['No high or luxurious seats and beds','Uccāsayana-mahāsayanā veramaṇī sikkhāpadaṃ samādiyāmi'];
const P9 = ['Dwelling with a mind of mettā (the Sri Lankan ninth)','Mettāsahagatena cetasā sabbapāṇabhūtesu pharitvā viharaṇaṃ samādiyāmi'];
const P10 = ['Not accepting gold, silver or money','Jātarūpa-rajata-paṭiggahaṇā veramaṇī sikkhāpadaṃ samādiyāmi'];
export const silSet = n => n === 10 ? [...P, P7a, P7b, P8, P10] : n === 9 ? [...P, P7, P8, P9] : [...P, P7, P8];
export const DHUT = [
  ['eka','One-sessioner','Ekāsanikaṅgaṃ samādiyāmi','Eat in a single sitting. Allowed to lay followers (Vism II §90).'],
  ['patta','Bowl-food-eater','Pattapiṇḍikaṅgaṃ samādiyāmi','Eat from one vessel only. Allowed to lay followers (Vism II §90).'],
  ['nes','Sitter\'s night','Nesajjikaṅgaṃ samādiyāmi','No lying down through the night. Kept by lay people by tradition rather than among the two Vism II §90 assigns them.']];

export const PLACES = [['Colombo',6.9271,79.8612],['Anuradhapura',8.3114,80.4037],['Kandy',7.2906,80.6337],['Galle',6.0535,80.221],['London',51.5072,-0.1276],['Dubai',25.2048,55.2708],['Singapore',1.3521,103.8198],['New York',40.7128,-74.006]];

// ---------------- Rubric ----------------
export const RUBRIC = [];
const sec = (id, title, cards) => RUBRIC.push({ id, title, cards });
sec('doors','The three doors',[
 {id:'body',k:'Body',t:'Bodily conduct',s:'MN 41 · AN 5.177 · AN 8.41',
  dont:['Killing any living being','Taking what is not freely given, including technically legal versions of it','Sexual misconduct','Intoxicants that cause heedlessness','Trade in weapons, human beings, meat, intoxicants or poisons (AN 5.177)'],
  do:['Lay down the rod: gentle, conscientious, kind to all beings (MN 41)','Give. Giving most directly loosens grasping (DN 33)'],
  best:['Uposatha on the four quarter days (AN 8.41)','Guard the sense doors: notice without grabbing the alluring detail','Eat for fuel, not fun or vanity (MN 2)','Know what the body is doing (MN 10)','Walk mindfully (AN 5.29)','One deliberate restraint from a pleasure each day (MN 36)']},
 {id:'speech',k:'Speech',t:'Verbal conduct',s:'MN 41 · MN 58 · AN 5.198 · MN 26',
  dont:['False speech, including half-truths','Divisive speech','Harsh speech','Idle chatter','True but useless speech; accurate flattery (MN 58)'],
  do:['Truthful and reliable','A reconciler who enjoys concord','Gentle words that reach the heart','Timely, factual, beneficial'],
  best:['Three gates (MN 58): true? beneficial? the right moment?','Five qualities (AN 5.198): timely, true, gentle, beneficial, with goodwill','Silence by default (MN 26)','One breath before any charged reply (MN 61)']},
 {id:'mind',k:'Mind',t:'Mental conduct',s:'MN 41 · MN 19 · MN 20 · MN 2 · AN 4.77 · MN 131 · SN 36.6',
  dont:['Coveting what is another\'s','Wishing harm','The view that conduct does not matter','Speculating about past lives, tracing kamma, seeking predictions (MN 2; AN 4.77)','Chasing the past, longing for the future (MN 131)','Firing the second arrow (SN 36.6)','Brooding remorse'],
  do:['The goodwill wish: may all beings be free of enmity and ill will, untroubled, and keep themselves happy (MN 41)','Intentions of renunciation, goodwill, harmlessness','I am the heir to what I do next (AN 5.57)'],
  best:['Label the slope (MN 19)','The five-step ladder (MN 20): substitute, see the danger, withdraw attention, still the source, force it down last','Match medicine to poison (Ud 4.1)','Recoil, resolve, release (MN 61)','Be glad for what went well']}
]);
sec('path','The Noble Eightfold Path',[
 {id:'p1',k:'Sammā diṭṭhi',t:'Right view',s:'SN 45.8 · MN 117',def:'Knowing suffering, its origin, its cessation, and the way leading to its cessation. Below it, the ten-fold right view of the world (MN 117).',do:['Hold daily: kamma matters, I am heir to my actions','Study, then reflect on how it applies today'],dont:['The view that conduct does not matter','Speculative views about self in past and future (MN 2)']},
 {id:'p2',k:'Sammā saṅkappa',t:'Right intention',s:'SN 45.8 · MN 19',def:'Intention of renunciation, of non-ill-will, of harmlessness.',do:['Sort thoughts into two piles (MN 19)','Turn toward renunciation, goodwill, compassion'],dont:['Entertaining sensual, hostile or cruel thought']},
 {id:'p3',k:'Sammā vācā',t:'Right speech',s:'SN 45.8',def:'Abstaining from false speech, divisive speech, harsh speech and idle chatter.',do:['Run the three gates before speaking (MN 58)'],dont:['The four wrong kinds of speech']},
 {id:'p4',k:'Sammā kammanta',t:'Right action',s:'SN 45.8',def:'Abstaining from killing, from taking what is not given, and from sexual misconduct.',do:['Kindness to all beings','Honesty in every exchange'],dont:['The three wrong bodily actions']},
 {id:'p5',k:'Sammā ājīva',t:'Right livelihood',s:'SN 45.8 · AN 5.177 · MN 117',def:'Giving up wrong livelihood and earning one\'s living by right livelihood.',do:['Wealth gained by effort and righteously (AN 4.61)'],dont:['The five trades of AN 5.177','Deceit, flattery, hinting, belittling, using gain to chase gain (MN 117)']},
 {id:'p6',k:'Sammā vāyāma',t:'Right effort',s:'SN 45.8',def:'The four efforts: to prevent unarisen unwholesome states, to abandon arisen ones, to arouse unarisen wholesome states, and to maintain, increase and perfect arisen ones.',do:['Keep old kusal growing; add new kusal (this Rubric\'s Add a skill)'],dont:['Letting a wholesome habit lapse unnoticed']},
 {id:'p7',k:'Sammā sati',t:'Right mindfulness',s:'SN 45.8 · MN 10',def:'Dwelling contemplating body, feelings, mind and phenomena, ardent, clearly knowing, mindful, free of covetousness and displeasure for the world.',do:['Clear comprehension in every posture (MN 10)'],dont:['Running on autopilot']},
 {id:'p8',k:'Sammā samādhi',t:'Right concentration',s:'SN 45.8',def:'The four jhānas: the first, secluded from sensual pleasures and unwholesome states, with applied and sustained thought, rapture and pleasure born of seclusion; the second, with inner stillness and unification; the third, equanimous, mindful, clearly knowing, dwelling in pleasure; the fourth, beyond pleasure and pain, with mindfulness purified by equanimity.',do:['One long sit on the main subject (ānāpāna) when the day allows'],dont:['Scattering practice into only short sessions']}
]);
const MN117 = [['Atthi dinnaṃ','There is meaning in giving'],['Atthi yiṭṭhaṃ','There is meaning in offering'],['Atthi hutaṃ','There is meaning in sacrifice'],['Atthi sukatadukkaṭānaṃ kammānaṃ phalaṃ vipāko','Good and bad deeds bear fruit'],['Atthi ayaṃ loko','There is this world'],['Atthi paro loko','There is the next world'],['Atthi mātā','There is mother (a debt and duty)'],['Atthi pitā','There is father'],['Atthi sattā opapātikā','There are spontaneously reborn beings'],['Atthi loke samaṇabrāhmaṇā sammaggatā sammāpaṭipannā','There are ascetics and brahmins who, rightly practising, have realised this world and the next for themselves and teach it']];
sec('view','Ten-fold right view · MN 117', MN117.map((x,i)=>({id:'v'+i,k:x[0],t:x[1],s:'MN 117',def:'One of the ten facets of world-level right view, beneath the right view of the Four Noble Truths.'})));
const PKV = [['Dāna','Giving','s'],['Sīla','Virtue','s'],['Bhāvanā','Meditation','s'],['Apacāyana','Reverence','c'],['Veyyāvacca','Service','c'],['Pattidāna','Sharing merit','c'],['Pattānumodanā','Rejoicing in others\' merit','c'],['Dhammassavana','Listening to the Dhamma','c'],['Dhammadesanā','Teaching the Dhamma','c'],['Diṭṭhujukamma','Straightening one\'s views','c']];
sec('merit','Ten bases of merit', PKV.map((x,i)=>({id:'m'+i,k:x[0],t:x[1],tier:x[2],s:x[2]==='s'?'DN 33 (the canonical three)':'Commentaries (the expansion to ten)'})));
const DV = [['Annaṃ','Food'],['Pānaṃ','Drink'],['Vatthaṃ','Clothing'],['Yānaṃ','Vehicles, transport'],['Mālā','Garlands, flowers'],['Gandha','Scents'],['Vilepana','Ointments'],['Seyyā','Beds'],['Āvasatha','Dwellings'],['Padīpeyya','Lamps']];
sec('giving','Ten bases of giving', DV.map((x,i)=>({id:'g'+i,k:x[0],t:x[1],s:'The standard canonical list, as in MN 135'})));
sec('tools','Daily mind tools',[
 {id:'t1',k:'AN 5.57',t:'The five reflections',s:'AN 5.57',def:'I am subject to ageing. To illness. To death. I will be parted from all I love. I am the owner and heir of my actions.'},
 {id:'t2',k:'MN 19',t:'Label the slope',s:'MN 19',def:'Whatever one frequently thinks and ponders becomes the inclination of the mind. Ask of each thought: does it lead to harm for me, for others, for both?'},
 {id:'t3',k:'MN 20',t:'The five-step ladder',s:'MN 20',def:'Substitute a wholesome object. See the danger. Withdraw attention. Still the thought-formation. Only last, force it down. Lightest first.'},
 {id:'t4',k:'MN 61',t:'The mirror',s:'MN 61',def:'Before, during and after any act of body, speech or mind: could this harm me, others, both? Disclose wrong deeds and words; recoil from wrong thoughts and resolve; be glad for what went well.'},
 {id:'t5',k:'MN 36',t:'The pleasure and pain check',s:'MN 36',def:'Developed in body, pleasant feeling does not take over the mind. Developed in mind, painful feeling does not. Ask both, each evening.'},
 {id:'t6',k:'Ud 4.1',t:'Medicine for each poison',s:'Ud 4.1',def:'Unattractiveness for lust. Mettā for ill will. Breath meditation to cut off thinking. Perception of impermanence to uproot the conceit "I am".'},
 {id:'t7',k:'Asubha',t:'Using asubha well',s:'MN 10 · SN 54.9',def:'Own body first, then others. On the street only when lust arises, then turn to mettā for that person. If it brings low mood or loathing, stop and switch to mettā or ānāpāna.'}
]);
