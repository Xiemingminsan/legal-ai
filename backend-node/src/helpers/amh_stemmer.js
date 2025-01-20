const  requires  = require('./systems.js');

const common_amh_abbr_list = {
  'ት/ቤት': 'ትምህርት ቤት',
  'ት/ርት': 'ትምህርት',
  'ት/ክፍል': 'ትምህርት ክፍል',
  'ሃ/አለቃ': 'ሃምሳ አለቃ',
  'ሃ/ስላሴ': 'ሃይለ ስላሴ',
  'ደ/ዘይት': 'ደብረ ዘይት',
  'ደ/ታቦር': 'ደብረ ታቦር',
  'መ/ር': 'መምህር',
  'መ/ቤት': 'መስሪያ ቤት',
  'መ/አለቃ': 'መቶ አለቃ',
  'ክ/ከተማ': 'ክፍለ ከተማ',
  'ክ/ሀገር': 'ክፍለ ሀገር',
  'ወ/ሮ': 'ወይዘሮ',
  'ወ/ሪት': 'ወይዘሪት',
  'ወ/ስላሴ': 'ወልደ ስላሴ',
  'ፍ/ስላሴ': 'ፍቅረ ስላሴ',
  'ፍ/ቤት': 'ፍርድ ቤት',
  'ጽ/ቤት': 'ጽህፈት ቤት',
  'ሲ/ር': 'ሲስተር',
  'ፕ/ር': 'ፕሮፌሰር',
  'ጠ/ሚንስትር': 'ጠቅላይ ሚኒስተር',
  'ዶ/ር': 'ዶክተር',
  'ገ/ግዮርጊስ': 'ገብረ ግዮርጊስ',
  'ቤ/ክርስትያን': 'ቤተ ክርስትያን',
  'ም/ስራ': 'ምክትል ስራ አስኪያጅ',
  'ም/ቤት': 'ምክር ቤተ',
  'ተ/ሃይማኖት': 'ተክለ ሃይማኖት',
  'ሚ/ር': 'ሚኒስትር',
  'ኮ/ል': 'ኮሎኔል',
  'ሜ/ጀነራል': 'ሜጀር ጀነራል',
  'ብ/ጀነራል': 'ብርጋደር ጀነራል',
  'ሌ/ኮለኔል': 'ሌተናንት ኮለኔል',
  'ሊ/መንበር': 'ሊቀ መንበር',
  'አ/አ': 'አዲስ ኣበባ',
  'ር/መምህር': 'ርዕሰ መምህር',
  ዓም: 'ዓመተ ምህረት',
  'ዓ.ም': 'ዓመተ ምህረት',
  'ዓ.ም.': 'ዓመተ ምህረት',
  'ዓ.ዓ': 'ዓመተ ዓለም',
  'ዓ.ዓ': 'ዓመተ ዓለም',
};

const punctuation_list = [
  '!',
  '"',
  '&',
  "'",
  '(',
  ')',
  '*',
  '+',
  ',',
  '-',
  '.',
  '/',
  ':',
  ';',
  '<',
  '=',
  '>',
  '?',
  '@',
  '[',
  '\\',
  ']',
  '^',
  '_',
  '`',
  '{',
  '|',
  '}',
  '~',
  '፣',
  '።',
  '፤',
  '፥',
  '÷',
  '፦',
  '፨',
  '“',
  '”',
  '-',
  '–',
  '—',
  '፩',
  '፪',
  '፫',
  '፬',
  '፭',
  '፮',
  '፯',
  '፰',
  '፱',
  '፲',
  '፳',
  '፴',
  '፵',
  '፶',
  '፷',
  '፸',
  '፹',
  '፺',
  '፻',
  '‹‹',
  '››',
  '«',
  '»',
  '›',
  '‹',
  '‘',
  '’',
  '‚',
  '‛',
  '፡',
  '…',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
];

const stop_word_list = [
  'ስለሚሆን',
  'እና',
  'በመሆኑም',
  'ሁሉ',
  'ሆነ',
  'ሌላ',
  'ልክ',
  'ስለ',
  'በቀር',
  'ብቻ',
  'ና',
  'አንዳች',
  'አንድ',
  'እንደ',
  'እንጂ',
  'ያህል',
  'ይልቅ',
  'ወደ',
  'እኔ',
  'የእኔ',
  'ራሴ',
  'እኛ',
  'የእኛ',
  'እራሳችን',
  'አንቺ',
  'የእርስዎ',
  'ራስህ',
  'ራሳችሁ',
  'እሱ',
  'እሱን',
  'የእሱ',
  'ራሱ',
  'እርሷ',
  'የእሷ',
  'ራሷ',
  'እነሱ',
  'እነሱን',
  'የእነሱ',
  'እራሳቸው',
  'ምንድን',
  'የትኛው',
  'ማንን',
  'ይህ',
  'እነዚያ',
  'ነኝ',
  'ነው',
  'ናቸው',
  'ነበር',
  'ነበሩ',
  'ሁን',
  'መሆን',
  'አለኝ',
  'አለው',
  'ነበረ',
  'መኖር',
  'ያደርጋል',
  'አደረገው',
  'መሥራት',
  'እና',
  'ግን',
  'ከሆነ',
  'ወይም',
  'ምክንያቱም',
  'እንደ',
  'እስከ',
  'ጋር',
  'ላይ',
  'መካከል',
  'በኩል',
  'ወቅት',
  'በኋላ',
  'ከላይ',
  'በርቷል',
  'ጠፍቷል',
  'በላይ',
  'ስር',
  'ከዚያ',
  'አንዴ',
  'እዚህ',
  'እዚያ',
  'መቼ',
  'የት',
  'እንዴት',
  'ሁሉም',
  'ሁለቱም',
  'እያንዳንዱ',
  'ጥቂቶች',
  'በጣም',
  'ሌላ',
  'አይ',
  'ወይም',
  'አይደለም',
  'ብቻ',
  'የራስ',
  'ተመሳሳይ',
  'ስለዚህ',
  'እኔም',
  'በጣም',
  'ይችላል',
  'ይሆናል',
  'በቃ',
  'አሁን',
  'መጣ',
  'ሄደ',
  'ከዚህ',
  'ወይንም',
  'አሁኑኑ',
  'ሌላ',
  'ሌላም',
  'እሷ',
  'የኔ',
  'እራሴ',
  'ጭምር',
  'ግን',
  'አንቺ',
  'አንተ',
  'እናንተ',
  'ያንተ',
  'ያንቺ',
  'የናንተ',
  'ራስህን',
  'ራስሽን',
  'ራሳችሁን',
  'ሁሉ',
  'ኋላ',
  'በሰሞኑ',
  'አሉ',
  'በኋላ',
  'ሁኔታ',
  'በኩል',
  'አስታውቀዋል',
  'ሆነ',
  'በውስጥ',
  'አስታውሰዋል',
  'ሆኑ',
  'ባጣም',
  'እስካሁን',
  'ሆኖም',
  'በተለይ',
  'አሳሰበ',
  'ሁል',
  'በተመለከተ',
  'አሳስበዋል',
  'ላይ',
  'በተመሳሳይ',
  'አስፈላጊ',
  'ሌላ',
  'የተለያየ',
  'አስገነዘቡ',
  'ሌሎች',
  'የተለያዩ',
  'አስገንዝበዋል',
  'ልዩ',
  'ተባለ',
  'አብራርተዋል',
  'መሆኑ',
  'ተገለጸ',
  'አስረድተዋል',
  'ተገልጿል',
  'ማለቱ',
  'ተጨማሪ',
  'እባክህ',
  'የሚገኝ',
  'ተከናወነ',
  'እባክሽ',
  'ማድረግ',
  'ችግር',
  'አንጻር',
  'ማን',
  'ትናንት',
  'እስኪደርስ',
  'ነበረች',
  'እንኳ',
  'ሰሞኑን',
  'ነበሩ',
  'እንኳን',
  'ሲሆን',
  'ነበር',
  'እዚሁ',
  'ሲል',
  'ነው',
  'እንደገለጹት',
  'አለ',
  'ና',
  'እንደተናገሩት',
  'ቢሆን',
  'ነገር',
  'እንዳስረዱት',
  'ብለዋል',
  'ነገሮች',
  'እንደገና',
  'ብዙ',
  'ናት',
  'ወቅት',
  'ቦታ',
  'ናቸው',
  'እንዲሁም',
  'በርካታ',
  'አሁን',
  'እንጂ',
  'እስከ',
  'ማለት',
  'የሚሆኑት',
  'ስለማናቸውም',
  'ውስጥ',
  'ይሆናሉ',
  'ሲባል',
  'ከሆነው',
  'ስለዚሁ',
  'ከአንድ',
  'ያልሆነ',
  'ሳለ',
  'የነበረውን',
  'ከአንዳንድ',
  'በማናቸውም',
  'በሙሉ',
  'የሆነው',
  'ያሉ',
  'በእነዚሁ',
  'ወር',
  'መሆናቸው',
  'ከሌሎች',
  'በዋና',
  'አንዲት',
  'ወይም',
  'በላይ',
  'እንደ',
  'በማቀድ',
  'ለሌሎች',
  'በሆኑ',
  'ቢሆንም',
  'ጊዜና',
  'ይሆኑበታል',
  'በሆነ',
  'አንዱ',
  'ለዚህ',
  'ለሆነው',
  'ለነዚህ',
  'ከዚህ',
  'የሌላውን',
  'ሶስተኛ',
  'አንዳንድ',
  'ለማንኛውም',
  'የሆነ',
  'ከሁለት',
  'የነገሩ',
  'ሰኣት',
  'አንደኛ',
  'እንዲሆን',
  'እንደነዚህ',
  'ማንኛውም',
  'ካልሆነ',
  'የሆኑት',
  'ጋር',
  'ቢያንስ',
  'ይህንንም',
  'እነደሆነ',
  'እነዚህን',
  'ይኸው',
  'የማናቸውም',
  'በሙሉም',
  'ይህችው',
  'በተለይም',
  'አንዱን',
  'የሚችለውን',
  'በነዚህ',
  'ከእነዚህ',
  'በሌላ',
  'የዚሁ',
  'ከእነዚሁ',
  'ለዚሁ',
  'በሚገባ',
  'ለእያንዳንዱ',
  'የአንቀጹ',
  'ወደ',
  'ይህም',
  'ስለሆነ',
  'ወይ',
  'ማናቸውንም',
  'ተብሎ',
  'እነዚህ',
  'መሆናቸውን',
  'የሆነችን',
  'ከአስር',
  'ሳይሆን',
  'ከዚያ',
  'የለውም',
  'የማይበልጥ',
  'እንደሆነና',
  'እንዲሆኑ',
  'በሚችሉ',
  'ብቻ',
  'ብሎ',
  'ከሌላ',
  'የሌላቸውን',
  'ለሆነ',
  'በሌሎች',
  'ሁለቱንም',
  'በቀር',
  'ይህ',
  'በታች',
  'አንደሆነ',
  'በነሱ',
  'ይህን',
  'የሌላ',
  'እንዲህ',
  'ከሆነ',
  'ያላቸው',
  'በነዚሁ',
  'በሚል',
  'የዚህ',
  'ይህንኑ',
  'በእንደዚህ',
  'ቁጥር',
  'ማናቸውም',
  'ሆነው',
  'ባሉ',
  'በዚህ',
  'በስተቀር',
  'ሲሆንና',
  'በዚህም',
  'መሆን',
  'ምንጊዜም',
  'እነዚህም',
  'በዚህና',
  'ያለ',
  'ስም',
  'ሲኖር',
  'ከዚህም',
  'መሆኑን',
  'በሁኔታው',
  'የማያንስ',
  'እነዚህኑ',
  'ማንም',
  'ከነዚሁ',
  'ያላቸውን',
  'እጅግ',
  'ሲሆኑ',
  'ለሆኑ',
  'ሊሆን',
  'ለማናቸውም',
  'እንደሚሰሩ',
  'የበኩላቸውን',
  'የሚጠበቅባቸውን',
  'ሊረጋገጥ',
  'አስተዋጽኦ',
];

const transliteration_lookup_table = {
  '': 'X',
  ሀ: 'he',
  ሁ: 'hu',
  ሂ: 'hi',
  ሃ: 'ha',
  ሄ: 'hE',
  ህ: 'h',
  ሆ: 'ho',
  ለ: 'le',
  ሉ: 'lu',
  ሊ: 'li',
  ላ: 'la',
  ሌ: 'lE',
  ል: 'l',
  ሎ: 'lo',
  ሏ: 'lWa',
  ሐ: 'He',
  ሑ: 'Hu',
  ሒ: 'Hi',
  ሓ: 'Ha',
  ሔ: 'HE',
  ሕ: 'H',
  ሖ: 'Ho',
  ሗ: 'HWa',
  መ: 'me',
  ሙ: 'mu',
  ሚ: 'mi',
  ማ: 'ma',
  ሜ: 'mE',
  ም: 'm',
  ሞ: 'mo',
  ሟ: 'mWa',
  ሠ: 'Se',
  ሡ: 'Su',
  ሢ: 'Si',
  ሣ: 'Sa',
  ሤ: 'SE',
  ሥ: 'S',
  ሦ: 'So',
  ሧ: 'SWa',
  ረ: 're',
  ሩ: 'ru',
  ሪ: 'ri',
  ራ: 'ra',
  ሬ: 'rE',
  ር: 'r',
  ሮ: 'ro',
  ሯ: 'rWa',
  ሰ: 'se',
  ሱ: 'su',
  ሲ: 'si',
  ሳ: 'sa',
  ሴ: 'sE',
  ስ: 's',
  ሶ: 'so',
  ሷ: 'sWa',
  ሸ: 'xe',
  ሹ: 'xu',
  ሺ: 'xi',
  ሻ: 'xa',
  ሼ: 'xE',
  ሽ: 'x',
  ሾ: 'xo',
  ሿ: 'xWa',
  ቀ: 'qe',
  ቁ: 'qu',
  ቂ: 'qi',
  ቃ: 'qa',
  ቄ: 'qE',
  ቅ: 'q',
  ቆ: 'qo',
  ቈ: 'qWe',
  ቊ: 'qWi',
  ቋ: 'qWa',
  ቌ: 'qWE',
  ቍ: 'qW',
  በ: 'be',
  ቡ: 'bu',
  ቢ: 'bi',
  ባ: 'ba',
  ቤ: 'bE',
  ብ: 'b',
  ቦ: 'bo',
  ቧ: 'bWa',
  ቨ: 've',
  ቩ: 'vu',
  ቪ: 'vi',
  ቫ: 'va',
  ቬ: 'vE',
  ቭ: 'v',
  ቮ: 'vo',
  ቯ: 'vWa',
  ተ: 'te',
  ቱ: 'tu',
  ቲ: 'ti',
  ታ: 'ta',
  ቴ: 'tE',
  ት: 't',
  ቶ: 'to',
  ቷ: 'tWa',
  ቸ: 'ce',
  ቹ: 'cu',
  ቺ: 'ci',
  ቻ: 'ca',
  ቼ: 'cE',
  ች: 'c',
  ቾ: 'co',
  ቿ: 'cWa',
  ኀ: 'hhe',
  ኁ: 'hhu',
  ኂ: 'hhi',
  ኃ: 'hha',
  ኄ: 'hhE',
  ኅ: 'hh',
  ኆ: 'hho',
  ኈ: 'hWe',
  ኊ: 'hWi',
  ኋ: 'hWa',
  ኌ: 'hWE',
  ኍ: 'hW',
  ነ: 'ne',
  ኑ: 'nu',
  ኒ: 'ni',
  ና: 'na',
  ኔ: 'nE',
  ን: 'n',
  ኖ: 'no',
  ኗ: 'nWa',
  ኘ: 'Ne',
  ኙ: 'Nu',
  ኚ: 'Ni',
  ኛ: 'Na',
  ኜ: 'NE',
  ኝ: 'N',
  ኞ: 'No',
  ኟ: 'NWa',
  አ: 'e',
  ኡ: 'u',
  ኢ: 'i',
  ኣ: 'a',
  ኤ: 'E',
  እ: 'I',
  ኦ: 'o',
  ኧ: 'ea',
  ከ: 'ke',
  ኩ: 'ku',
  ኪ: 'ki',
  ካ: 'ka',
  ኬ: 'kE',
  ክ: 'k',
  ኮ: 'ko',
  ኰ: 'kWe',
  ኲ: 'kWi',
  ኳ: 'kWa',
  ኴ: 'kWE',
  ኵ: 'kW',
  ኸ: 'Ke',
  ኹ: 'Ku',
  ኺ: 'Ki',
  ኻ: 'Ka',
  ኼ: 'KE',
  ኽ: 'K',
  ኾ: 'Ko',
  ዀ: 'KWe',
  ዂ: 'KWi',
  ዃ: 'KWa',
  ዄ: 'KWE',
  ዅ: 'KW',
  ወ: 'we',
  ዉ: 'wu',
  ዊ: 'wi',
  ዋ: 'wa',
  ዌ: 'wE',
  ው: 'w',
  ዎ: 'wo',
  ዐ: 'E',
  ዑ: 'U',
  ዒ: 'I',
  ዓ: 'A',
  ዔ: 'EE',
  ዕ: 'II',
  ዖ: 'O',
  ዘ: 'ze',
  ዙ: 'zu',
  ዚ: 'zi',
  ዛ: 'za',
  ዜ: 'zE',
  ዝ: 'z',
  ዞ: 'zo',
  ዟ: 'zWa',
  ዠ: 'Ze',
  ዡ: 'Zu',
  ዢ: 'Zi',
  ዣ: 'Za',
  ዤ: 'ZE',
  ዥ: 'Z',
  ዦ: 'Zo',
  ዧ: 'ZWa',
  የ: 'ye',
  ዩ: 'yu',
  ዪ: 'yi',
  ያ: 'ya',
  ዬ: 'yE',
  ይ: 'y',
  ዮ: 'yo',
  ደ: 'de',
  ዱ: 'du',
  ዲ: 'di',
  ዳ: 'da',
  ዴ: 'dE',
  ድ: 'd',
  ዶ: 'do',
  ዷ: 'dWa',
  ጀ: 'je',
  ጁ: 'ju',
  ጂ: 'ji',
  ጃ: 'ja',
  ጄ: 'jE',
  ጅ: 'j',
  ጆ: 'jo',
  ጇ: 'jWa',
  ገ: 'ge',
  ጉ: 'gu',
  ጊ: 'gi',
  ጋ: 'ga',
  ጌ: 'gE',
  ግ: 'g',
  ጎ: 'go',
  ጐ: 'gWe',
  ጒ: 'gWi',
  ጓ: 'gWa',
  ጔ: 'gWE',
  ጕ: 'gW',
  ጠ: 'Te',
  ጡ: 'Tu',
  ጢ: 'Ti',
  ጣ: 'Ta',
  ጤ: 'TE',
  ጥ: 'T',
  ጦ: 'To',
  ጧ: 'TWa',
  ጨ: 'Ce',
  ጩ: 'Cu',
  ጪ: 'Ci',
  ጫ: 'Ca',
  ጬ: 'CE',
  ጭ: 'C',
  ጮ: 'Co',
  ጯ: 'CWa',
  ጰ: 'Pe',
  ጱ: 'Pu',
  ጲ: 'Pi',
  ጳ: 'Pa',
  ጴ: 'PE',
  ጵ: 'P',
  ጶ: 'Po',
  ጷ: 'PWa',
  ጸ: 'SSe',
  ጹ: 'SSu',
  ጺ: 'SSi',
  ጻ: 'SSa',
  ጼ: 'SSE',
  ጽ: 'SS',
  ጾ: 'SSo',
  ጿ: 'SSWa',
  ፀ: 'SSSe',
  ፁ: 'SSSu',
  ፂ: 'SSSi',
  ፃ: 'SSSa',
  ፄ: 'SSSE',
  ፅ: 'SSS',
  ፆ: 'SSSo',
  ፈ: 'fe',
  ፉ: 'fu',
  ፊ: 'fi',
  ፋ: 'fa',
  ፌ: 'fE',
  ፍ: 'f',
  ፎ: 'fo',
  ፏ: 'fWa',
  ፐ: 'pe',
  ፑ: 'pu',
  ፒ: 'pi',
  ፓ: 'pa',
  ፔ: 'pE',
  ፕ: 'p',
  ፖ: 'po',
  ፗ: 'pWa',
  
  '፩': '1',
  '፪': '2',
  '፫': '3',
  '፬': '4',
  '፭': '5',
  '፮': '6',
  '፯': '7',
  '፰': '8',
  '፱': '9',
  '፲': '10',
  '፳': '11',
  '፴': '12',
  '፵': '13',
  '፶': '14',
  '፷': '15',
  '፸': '16',
  '፹': '17',
  '፺': '18',
  '፻': '19',
};

const suffixList = [
  'ኦችኣችኧውንንኣ',
  'ንኧትኣችኧው',
  'ኧኝኣንኧትም',
  'ኦችኣችኧውን',
  'ኣችኧውንንኣ',
  'ውኦችኣችን',
  'ኢዕኧልኧሽ',
  'ኣችኧውኣል',
  'ኧችኣችህኡ',
  'ኧችኣችኧው',
  'ኣልኣልኧች',
  'ብኣችኧውስ',
  'ኣልኣችህኡ',
  'ውኦችንንኣ',
  'ኧኝኣንኧት',
  'ኦችኣችህኡ',
  'ኦችኣችኧው',
  'ኝኣንኧትም',
  'ኣልኧህኡ',
  'ኣልችህኡ',
  'ብኣችኧው',
  'ኣችኧውን',
  'ኣችህኡን',
  'ኣችህኡት',
  'ኧኝኣንኣ',
  'ኧኝኣውም',
  'ኣችህኡም',
  'ኦችንንኣ',
  'ኦችኣችን',
  'ችኣችህኡ',
  'ችኣችኧው',
  // "ውኦችኡን",
  'ኝኣንኧት',
  'ዊነታቸው',
  'ውያንን',
  'ነታቸው',
  'ኣውኢው',
  'ኧችኣት',
  'ኣውኦች',
  'ኣልኧህ',
  'ኣልኧሽ',
  'ኣልኧች',
  'ኣልኧን',
  'ኣችህኡ',
  'ውኦችን',
  'ኣችኧው',
  'ኦችኡን',
  'ኧውንኣ',
  'ኦችኡን',
  'ኦውኦች',
  'ኧኝኣን',
  'ኧኝኣው',
  'ኝኣውኣ',
  'ብኧትን',
  'ይኡሽን',
  'ኝኣውን',
  // "ውኦችኡ",
  'ኝኣንኣ',
  'ኝኣውም',
  'ችኣችን',
  'ኦችኡ',
  'ኦውኣ',
  'ኧችው',
  'ኧችኡ',
  'ኤችኡ',
  'ንኧው',
  'ንኧት',
  'ኣልኡ',
  'ኣችን',
  'ክኡም',
  'ክኡት',
  'ክኧው',
  'ኧችን',
  'ኧችም',
  'ኧችህ',
  'ኧችሽ',
  'ኧችን',
  'ኧችው',
  'ይኡሽ',
  'ይኧው',
  'ኧውኢ',
  'ኣውኢ',
  'ብኧት',
  'ኦችኡ',
  'ውኦን',
  'ኧኝኣ',
  'ኝኣው',
  'ኦችን',
  'ችኣት',
  'ውንኣ',
  'ውኦች',
  'ኝኣን',
  'ኣውኣ',
  'ኦችህ',
  'ኦችሽ',
  'ኦችኤ',
  'ዊቷ',
  'ኢቷ',
  'ኦች',
  'ኣል',
  'ኧም',
  'ሽው',
  'ክም',
  'ኧው',
  'ትም',
  'ውኦ',
  'ውም',
  'ውን',
  'ንም',
  'ሽን',
  'ኣች',
  'ኡት',
  'ኢት',
  'ክኡ',
  'ኧች',
  'ኡን',
  'ንኣ',
  'ኦቿ',
  'ችው',
  'ችኡ',
  'ችን',
  'ችም',
  'ችህ',
  'ችሽ',
  'ውኢ',
  'ኝኣ',
  'ውኣ',
  'ነት',
  // 'ኤ',
  'ህ',
  'ሽ',
  'ኡ',
  'ሽ',
  'ክ',
  'ኧ',
  'ን',
  'ም',
  'ው',
  'ዊ',
  'ች',
  'ቷ',
];

const prefixList = [
  'ስልኧምኣይ',
  'ይኧምኣት',
  'ዕንድኧ',
  'ይኧትኧ',
  // 'ብኧምኣ',
  'ብኧትኧ',
  'ዕኧል',
  'ስልኧ',
  'ምኧስ',
  'እንደ',
  'ዕይኧ',
  'ዕኧስ',
  'ዕኧት',
  'ዕኧን',
  'ዕኧይ',
  'ይኣል',
  'ስኣት',
  'ስኣን',
  'ስኣይ',
  'ይኣስ',
  'ስኣል',
  'ኣል',
  'ይኧ',
  'ልኧ',
  'ክኧ',
  'እን',
  'ዕን',
  'ዐል',
  'ብኧ',
  'አል',
  'አስ',
  'ትኧ',
  'አት',
  // 'አን',
  'አይ',
  'ስ',
  'ይ',
  // 'አ',
  'እ',
  'በ',
  'የ',
  'ለ',
];

// Initialize globals
let suffixes = [];
let prefixes = [];

// Initialize transliterated suffixes and prefixes
function initializeStemmer(suffixList, prefixList) {
  if (!Array.isArray(suffixList) || !Array.isArray(prefixList)) {
      throw new Error("Suffix and prefix lists must be valid arrays.");
  }
  suffixes = suffixList.map(suf => {
      let [w, l] = amharicTranslitator(suf);
      return w;
  });
  
  prefixes = prefixList.map(pre => {
      let [w, l] = amharicTranslitator(pre);
      return w;
  });
}
function stateOfTheArtAmharicStemmer(fullText) {
    // First initialize the stemmer with suffix and prefix lists
    initializeStemmer(suffixList, prefixList);
    
    // Validate input
    if (!fullText || typeof fullText !== 'string') {
        return '';
    }

    // Initialize result array
    let stemmedText = '';
    
    // Step 1: Text preprocessing
    let processedText = convertAbbrevations(fullText);
    processedText = removePunctuations(processedText);
    processedText = stopwordRemover(processedText);
    
    // Step 2: Split into words and process each
    const words = processedText.split(/\s+/).filter(word => word);

    words.forEach(word => {
        let amhWord = '';

        if (requires && requires[word]) {
            amhWord = requires[word];
        } else {
            const [engWord, wordNumbers] = amharicTranslitator(word);
            const [newEngWord, newWordNumbers] = stemmer(engWord, wordNumbers);
            amhWord = englishTranslitator(newEngWord, newWordNumbers);
        }
        
        // Add to results if valid
        if (amhWord) {
          stemmedText += amhWord + ' ';
      }
  });

  // Trim the trailing space and return
  return stemmedText.trim();
}

function convertAbbrevations(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }
  if (!common_amh_abbr_list || typeof common_amh_abbr_list !== 'object') {
    throw new Error('Invalid abbreviation list: common_amh_abbr_list is not defined or not an object');
  }
  for (const abbr in common_amh_abbr_list) {
    if (text.includes(abbr)) {
      text = text.replace(abbr, common_amh_abbr_list[abbr]);
    }
  }
  return text;
}

function removePunctuations(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }
  if (!common_amh_abbr_list || typeof common_amh_abbr_list !== 'object') {
    throw new Error('Invalid abbreviation list: common_amh_abbr_list is not defined or not an object');
  }
  const chars = text.split('');
  text = chars.map((char) => {
    if (!punctuation_list.includes(char)) {
      return char;
    }
    if (char == '-') {
      return ' ';
    }
  });
  return text.join('');
}

function stopwordRemover(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }
  if (!common_amh_abbr_list || typeof common_amh_abbr_list !== 'object') {
    throw new Error('Invalid abbreviation list: common_amh_abbr_list is not defined or not an object');
  }
  const words = text.split(/\s+/);
  text = words.map((word, index) => {
    if (!stop_word_list.includes(word)) {
      return word
        .replace(/\n+/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }
  });
  // console.log(typeof text);
  // let test = ['a', 'b', 'c'];
  return text.join(' ');
}

function amharicTranslitator(word) {
  let translitatedWord = '';
  let wordNumbers = [];

  let tokens = word.split('');
  tokens.forEach((letter) => {
    if (transliteration_lookup_table[letter] !== undefined) {
      translitatedWord += transliteration_lookup_table[letter];
      wordNumbers.push(transliteration_lookup_table[letter].length);
    }
  });
  // console.log(`${translitatedWord}: ${wordNumbers}`);
  return [translitatedWord, wordNumbers];
}

function englishTranslitator(word, wordNumbers = []) {
  let translitatedWord = '';

  let tokens = [];

  if (wordNumbers.length == 0) {
    tokens = word.match(/.{1,2}/g);
  } else {
    let currentIndex = 0;

    wordNumbers.forEach((num) => {
      // console.log(num);
      tokens.push(word.substring(currentIndex, currentIndex + num));
      currentIndex += num;
      // console.log(word);
    });
  }
  // console.log(word);
  // console.log(wordNumbers.length);
  // console.log(tokens);

  if (tokens === null) {
    return '';
  }

  tokens.forEach((letter) => {
    if (!letter || typeof letter !== 'string') {
      throw new Error('Invalid input: text must be a non-empty string');
    }
    if (!common_amh_abbr_list || typeof common_amh_abbr_list !== 'object') {
      throw new Error('Invalid abbreviation list: common_amh_abbr_list is not defined or not an object');
    }
    if (/[^aeiou][aeiou]/i.test(letter)) {
      let am_letter = '';

      // if (/[W][a]/g.test(letter)) {
      //   am_letter = Object.keys(transliteration_lookup_table).find(
      //     (key) =>
      //       transliteration_lookup_table[key] === letter.toLowerCase()
      //   );
      // } else {
      am_letter = Object.keys(transliteration_lookup_table).find(
        (key) => transliteration_lookup_table[key] === letter
      );
      // }

      if (!am_letter.includes('undefined')) {
        translitatedWord += am_letter;
      }
    } else {
      let ltrs = letter.split('');
      let am_letter = '';
      ltrs.forEach((ltr) => {
        am_letter += Object.keys(transliteration_lookup_table).find(
          (key) => transliteration_lookup_table[key] === ltr
        );
      });

      if (!am_letter.includes('undefined') && am_letter !== 'ኧ') {
        translitatedWord += am_letter;
      }
    }
  });

  return translitatedWord;
}

function stemmer(engWord, wordNumbers) {
  const [suffixRemoved, newWordNumbers] = rmSuffixes(engWord, wordNumbers);
  const [prefixRemoved, newWordNumbers2] = rmPrefixes(
    suffixRemoved,
    newWordNumbers
  );
  const [infixRemoved, newWordNumbers3] = rmInfixes(
    prefixRemoved,
    newWordNumbers2
  );
  return [infixRemoved, newWordNumbers3];
}

function rmSuffixes(engWord, wordNumbers) {
  if (wordNumbers.length > 2) {
    let newEngWord = '';
    let newWordNumbers = [];
    for (const suf of suffixes) {
      if (engWord.endsWith(suf)) {
        const suffixLength = suf.length;
        newEngWord = engWord.slice(0, -suffixLength);
        // console.log(`${newEngWord} : ${newEngWord}`);
        let lengthSum = 0;
        let count = 0;
        for (let i = wordNumbers.length - 1; i >= 0; i--) {
          lengthSum += wordNumbers[i];
          count++;
          if (lengthSum >= suffixLength) break;
        }

        newWordNumbers = wordNumbers.slice(0, -count);

        const newEngWordLength = newEngWord.length;
        const newWordNumbersSum = newWordNumbers.reduce(
          (acc, curr) => acc + curr,
          0
        );

        if (newEngWordLength !== newWordNumbersSum) {
          const difference = newEngWordLength - newWordNumbersSum;
          if (newWordNumbers[newWordNumbers.length - 1] == null) {
            newWordNumbers.push(difference);
          } else {
            if (
              newWordNumbers[newWordNumbers.length - 1] !=
              wordNumbers[newWordNumbers.length - 1]
            ) {
              newWordNumbers[newWordNumbers.length - 1] += difference;
            } else {
              newWordNumbers.push(difference);
            }
          }
        }
        break;
      } else {
        newEngWord = engWord;
        newWordNumbers = wordNumbers;
      }
    }
    return [newEngWord, newWordNumbers];
  } else {
    return [engWord, wordNumbers];
  }
}

function rmPrefixes(engWord, wordNumbers) {
  if (wordNumbers.length > 2) {
    let newEngWord = '';
    let newWordNumbers = [];
    let flag = true;
    for (const pre of prefixes) {
      if (engWord.startsWith(pre)) {
        flag = false;
        const prefixLength = pre.length;
        // console.log(`${newEngWord} : ${newEngWord}`);
        let lengthSum = 0;
        let count = 0;
        for (let i = 0; i < wordNumbers.length; i++) {
          lengthSum += wordNumbers[i];
          count++;
          if (lengthSum >= prefixLength) {
            if (lengthSum == prefixLength) flag = true;
            break;
          }
        }
        if (flag) {
          newEngWord = engWord.slice(prefixLength);

          newWordNumbers = wordNumbers.slice(count);
          // console.log(
          // `${wordNumbers}: ${newWordNumbers}: ${engWord}: ${newEngWord}`
          // );

          const newEngWordLength = newEngWord.length;
          const newWordNumbersSum = newWordNumbers.reduce(
            (acc, curr) => acc + curr,
            0
          );

          if (newEngWordLength !== newWordNumbersSum) {
            const difference = newEngWordLength - newWordNumbersSum;
            if (newWordNumbers[0] == null) {
              newWordNumbers.unshift(difference);
            } else {
              if (newWordNumbers[0] != wordNumbers[count - 1]) {
                newWordNumbers[0] += difference;
              } else {
                newWordNumbers.unshift(difference);
              }
            }
          }
          break;
        }
      } else {
        newEngWord = engWord;
        newWordNumbers = wordNumbers;
      }
    }
    return [newEngWord, newWordNumbers];
  } else {
    return [engWord, wordNumbers];
  }
}

function rmInfixes(engWord, wordNumbers) {
  if (wordNumbers.length > 3) {
    let tempEngWord = engWord;
    const pattern = /.+([^aeiou])[a]\1.?/;
    if (/.+([^aeiou])a\1.?/i.test(engWord)) {
      engWord = engWord.replace(/[^aeiou]a/i, '');
      // console.log('1: ', engWord);
    } else if (/(.+)[aeiou]\1[aeiou]/i.test(engWord)) {
      engWord = engWord.replace(/(.+)[aeiou](\1[aeiou])/i, '$2');
      // console.log('4: ', engWord);
    } else if (/^(.+)a\1/i.test(engWord)) {
      engWord = engWord.replace(/a.+/i, '');
      // console.log('2: ', engWord);
    } else if (/^([aeiou](.+?))[aeiou]\2/i.test(engWord)) {
      engWord = engWord.replace(/^([aeiou](.+?))[aeiou]\2/i, '$1');
      // console.log('3: ', engWord);
    } else if (/.+([^aeiou])([^aeiou]a\1)/i.test(engWord)) {
      engWord = engWord.replace(/[^aeiou]a.+/i, '');
      // console.log('5: ', engWord);
    }

    if (/^[bcdfghjklmnpqrstvwxyz]{2}e/i.test(engWord)) {
      let ccv = engWord.match(/[bcdfghjklmnpqrstvwxyz]{2}e/i);

      engWord = engWord.replace(
        /[bcdfghjklmnpqrstvwxyz]{2}e/i,
        ccv[0].substring(0, 1) + 'X' + ccv[0].substring(1)
      );
      // console.log("4: ", engWord);
    }
    if (engWord === tempEngWord) {
      return [engWord, wordNumbers];
    } else {
      return [engWord, []];
    }
  } else {
    return [engWord, wordNumbers];
  }
}


module.exports = {
  stateOfTheArtAmharicStemmer,
};