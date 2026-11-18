import type { Lang, Lesson } from "./types";

// A built-in sample chapter (the traditional folk tale "The Cap Seller and the Monkeys")
// in all three languages. It lets the app be demonstrated even with no internet / API quota.
// It uses the aemr104 illustrations.

export const DEMO_BOOK_ID = "aemr104";

const en: Lesson = {
  language: "en",
  chapterTitle: "The Cap Seller and the Monkeys",
  overview: "A cap seller takes a nap under a tree. Naughty monkeys take his caps! He uses a clever idea to get them back.",
  subtopics: [
    {
      order: 1,
      title: "The Cap Seller Takes a Nap",
      sourceContent: "A man sells caps in villages. One hot day he feels tired and sleeps under a big tree.",
      storyScript:
        "Once there was a cap seller.\nHe carried a big basket of colourful caps.\nHe walked from village to village calling, \"Caps! Caps for sale!\"\nOne day the sun was very hot.\nHe felt tired and sat under a big shady tree.\nHe kept his basket next to him.\nSoon he fell fast asleep.",
      visualDescription: "A cap seller sleeping under a big tree with a basket of colourful caps, monkeys peeping from the branches.",
      explanation: "The cap seller worked hard selling caps. He was tired from the heat, so he rested under a tree.",
      keyPoints: ["The man sold caps.", "It was a hot day.", "He slept under a big tree."],
      emoji: "🧢🌳😴",
    },
    {
      order: 2,
      title: "The Naughty Monkeys",
      sourceContent: "Monkeys living on the tree come down, take the caps from the basket and climb back up.",
      storyScript:
        "Many monkeys lived on that tree.\nThey saw the colourful caps.\nOne by one they climbed down quietly.\nEach monkey took a cap and put it on.\nThen they ran back up the tree.\nThe cap seller woke up.\nHis basket was empty!\nHe looked up and saw monkeys wearing his caps.",
      visualDescription: "Playful monkeys wearing colourful caps sitting on tree branches while the surprised cap seller looks up.",
      explanation: "Monkeys like to copy and play. They took the caps while the man was sleeping.",
      keyPoints: ["Monkeys lived on the tree.", "The monkeys took the caps.", "The basket became empty."],
      emoji: "🐒🧢🌳",
    },
    {
      order: 3,
      title: "A Clever Idea",
      sourceContent: "The monkeys copy whatever the cap seller does. He throws his own cap down, the monkeys throw theirs, and he collects all the caps.",
      storyScript:
        "The cap seller shook his fist at the monkeys.\nThe monkeys shook their fists too!\nHe scratched his head.\nThe monkeys scratched their heads too!\nThen he had a clever idea.\nHe threw his own cap on the ground.\nThe monkeys also threw their caps down.\nHe picked up all the caps and went home happily.",
      visualDescription: "The smiling cap seller collecting caps from the ground while monkeys copy him from the tree.",
      explanation: "Monkeys copy what they see. The cap seller used his brain, not anger, to solve the problem.",
      keyPoints: ["Monkeys copy what people do.", "He threw his cap down.", "Thinking calmly solves problems."],
      emoji: "💡🧢😊",
    },
  ],
  storyLesson:
    "Once there was a cap seller with a basket full of colourful caps.\nOne hot day he rested under a big tree and fell asleep.\nMonkeys on the tree came down and took all his caps.\nWhen he woke up, the basket was empty.\nHe saw the monkeys wearing his caps on the tree.\nHe shook his fist, and the monkeys shook their fists.\nHe scratched his head, and the monkeys scratched their heads.\nThen he had a clever idea and threw his cap down.\nThe monkeys copied him and threw their caps down too.\nHe collected all the caps and went home happily.",
  smartNotes:
    "The man in the story is a **cap seller**.\nHe slept under a **big tree** on a hot day.\nThe **monkeys** took his caps.\nMonkeys **copy** what they see.\nHe **threw his cap** on the ground.\nThe monkeys threw the caps down and he got them **all back**.\nLesson: **think calmly** to solve a problem.",
  keyWords: [
    { word: "Cap", meaning: "A soft hat worn on the head" },
    { word: "Seller", meaning: "A person who sells things" },
    { word: "Copy", meaning: "To do the same thing someone else does" },
    { word: "Clever", meaning: "Quick at thinking of good ideas" },
  ],
  quiz: [
    { question: "What did the man sell?", options: ["Fruits", "Caps", "Toys", "Shoes"], answer: "Caps", answerIndex: 1, explanation: "He was a cap seller with a basket of caps." },
    { question: "Where did the cap seller sleep?", options: ["In his house", "On a boat", "Under a big tree", "In a shop"], answer: "Under a big tree", answerIndex: 2, explanation: "It was hot, so he rested under a shady tree." },
    { question: "Who took the caps?", options: ["Monkeys", "Birds", "Children", "Cats"], answer: "Monkeys", answerIndex: 0, explanation: "The monkeys living on the tree took the caps." },
    { question: "What do monkeys like to do?", options: ["Sleep all day", "Read books", "Copy others", "Sell caps"], answer: "Copy others", answerIndex: 2, explanation: "Monkeys copy what they see others doing." },
    { question: "How did the cap seller get his caps back?", options: ["He cried", "He threw his own cap down", "He climbed the tree", "He called the police"], answer: "He threw his own cap down", answerIndex: 1, explanation: "The monkeys copied him and threw their caps down too." },
  ],
  matchPairs: [
    { left: "Cap seller", right: "Sold colourful caps", emoji: "🧑" },
    { left: "Monkeys", right: "Took the caps", emoji: "🐒" },
    { left: "Big tree", right: "Where he slept", emoji: "🌳" },
    { left: "Clever idea", right: "Threw his cap down", emoji: "💡" },
  ],
  challenges: [
    { type: "truefalse", prompt: "The cap seller slept under a big tree.", answer: "Yes, he slept under a big tree.", isTrue: true, explanation: "It was a hot day, so he rested in the shade." },
    { type: "flashcard", prompt: "Why did the monkeys throw the caps down?", answer: "They copied the cap seller.", isTrue: true, explanation: "Monkeys copy what they see." },
    { type: "truefalse", prompt: "The cap seller climbed the tree to get his caps.", answer: "No, he threw his own cap down.", isTrue: false, explanation: "He used a clever idea instead of climbing." },
  ],
};

const hi: Lesson = {
  language: "hi",
  chapterTitle: "टोपीवाला और बंदर",
  overview: "एक टोपीवाला पेड़ के नीचे सो जाता है। शरारती बंदर उसकी टोपियाँ ले जाते हैं! वह एक चतुर तरकीब से टोपियाँ वापस पाता है।",
  subtopics: [
    {
      ...en.subtopics[0],
      title: "टोपीवाला सो गया",
      sourceContent: "एक आदमी गाँव-गाँव टोपियाँ बेचता है। एक गरम दिन वह थककर बड़े पेड़ के नीचे सो जाता है।",
      storyScript:
        "एक था टोपीवाला।\nउसके पास रंग-बिरंगी टोपियों की बड़ी टोकरी थी।\nवह गाँव-गाँव जाकर पुकारता, \"टोपी ले लो, टोपी!\"\nएक दिन बहुत तेज़ धूप थी।\nवह थक गया और एक बड़े छायादार पेड़ के नीचे बैठ गया।\nउसने टोकरी अपने पास रख ली।\nथोड़ी देर में उसे गहरी नींद आ गई।",
      explanation: "टोपीवाला मेहनत से टोपियाँ बेचता था। गर्मी से थककर उसने पेड़ के नीचे आराम किया।",
      keyPoints: ["आदमी टोपियाँ बेचता था।", "उस दिन बहुत गर्मी थी।", "वह बड़े पेड़ के नीचे सो गया।"],
    },
    {
      ...en.subtopics[1],
      title: "शरारती बंदर",
      sourceContent: "पेड़ पर रहने वाले बंदर नीचे आते हैं, टोकरी से टोपियाँ लेते हैं और ऊपर चढ़ जाते हैं।",
      storyScript:
        "उस पेड़ पर बहुत सारे बंदर रहते थे।\nउन्होंने रंग-बिरंगी टोपियाँ देखीं।\nवे एक-एक करके चुपचाप नीचे उतरे।\nहर बंदर ने एक टोपी ली और पहन ली।\nफिर वे भागकर पेड़ पर चढ़ गए।\nटोपीवाले की नींद खुली।\nउसकी टोकरी खाली थी!\nउसने ऊपर देखा तो बंदर उसकी टोपियाँ पहने बैठे थे।",
      explanation: "बंदरों को नकल करना और खेलना पसंद है। आदमी के सोते समय उन्होंने टोपियाँ ले लीं।",
      keyPoints: ["बंदर पेड़ पर रहते थे।", "बंदरों ने टोपियाँ ले लीं।", "टोकरी खाली हो गई।"],
    },
    {
      ...en.subtopics[2],
      title: "एक चतुर तरकीब",
      sourceContent: "टोपीवाला जो करता है, बंदर वही करते हैं। वह अपनी टोपी नीचे फेंकता है, बंदर भी फेंकते हैं, और वह सारी टोपियाँ उठा लेता है।",
      storyScript:
        "टोपीवाले ने बंदरों को मुट्ठी दिखाई।\nबंदरों ने भी मुट्ठी दिखाई!\nउसने अपना सिर खुजाया।\nबंदरों ने भी अपना सिर खुजाया!\nतब उसे एक चतुर तरकीब सूझी।\nउसने अपनी टोपी ज़मीन पर फेंक दी।\nबंदरों ने भी अपनी टोपियाँ नीचे फेंक दीं।\nउसने सारी टोपियाँ उठाईं और खुशी-खुशी घर चला गया।",
      explanation: "बंदर जो देखते हैं, उसकी नकल करते हैं। टोपीवाले ने गुस्से से नहीं, दिमाग से काम लिया।",
      keyPoints: ["बंदर लोगों की नकल करते हैं।", "उसने अपनी टोपी नीचे फेंकी।", "शांत होकर सोचने से हल मिलता है।"],
    },
  ],
  storyLesson:
    "एक टोपीवाले के पास रंग-बिरंगी टोपियों की टोकरी थी।\nएक गरम दिन वह बड़े पेड़ के नीचे आराम करते हुए सो गया।\nपेड़ के बंदर नीचे आए और उसकी सारी टोपियाँ ले गए।\nजब वह जागा, तो टोकरी खाली थी।\nउसने देखा कि बंदर पेड़ पर उसकी टोपियाँ पहने बैठे हैं।\nउसने मुट्ठी दिखाई, बंदरों ने भी मुट्ठी दिखाई।\nउसने सिर खुजाया, बंदरों ने भी सिर खुजाया।\nतब उसे एक चतुर तरकीब सूझी और उसने अपनी टोपी नीचे फेंक दी।\nबंदरों ने उसकी नकल की और अपनी टोपियाँ भी नीचे फेंक दीं।\nउसने सारी टोपियाँ उठाईं और खुशी-खुशी घर चला गया।",
  smartNotes:
    "कहानी का आदमी एक **टोपीवाला** है।\nगरम दिन वह **बड़े पेड़** के नीचे सोया।\n**बंदरों** ने उसकी टोपियाँ ले लीं।\nबंदर जो देखते हैं, उसकी **नकल** करते हैं।\nउसने अपनी **टोपी नीचे फेंकी**।\nबंदरों ने टोपियाँ नीचे फेंकीं और उसे **सब वापस** मिल गईं।\nसीख: समस्या को **शांत होकर सोचो**।",
  keyWords: [
    { word: "टोपी", meaning: "सिर पर पहनने वाली चीज़" },
    { word: "बेचने वाला", meaning: "जो आदमी चीज़ें बेचता है" },
    { word: "नकल", meaning: "किसी और जैसा ही करना" },
    { word: "चतुर", meaning: "जल्दी अच्छी बात सोचने वाला" },
  ],
  quiz: [
    { question: "आदमी क्या बेचता था?", options: ["फल", "टोपियाँ", "खिलौने", "जूते"], answer: "टोपियाँ", answerIndex: 1, explanation: "वह टोपीवाला था, उसके पास टोपियों की टोकरी थी।" },
    { question: "टोपीवाला कहाँ सोया?", options: ["अपने घर में", "नाव पर", "बड़े पेड़ के नीचे", "दुकान में"], answer: "बड़े पेड़ के नीचे", answerIndex: 2, explanation: "गर्मी थी, इसलिए उसने छायादार पेड़ के नीचे आराम किया।" },
    { question: "टोपियाँ किसने लीं?", options: ["बंदरों ने", "चिड़ियों ने", "बच्चों ने", "बिल्लियों ने"], answer: "बंदरों ने", answerIndex: 0, explanation: "पेड़ पर रहने वाले बंदरों ने टोपियाँ लीं।" },
    { question: "बंदरों को क्या करना पसंद है?", options: ["दिन भर सोना", "किताब पढ़ना", "दूसरों की नकल करना", "टोपी बेचना"], answer: "दूसरों की नकल करना", answerIndex: 2, explanation: "बंदर दूसरों को जो करते देखते हैं, वही करते हैं।" },
    { question: "टोपीवाले को टोपियाँ वापस कैसे मिलीं?", options: ["वह रोया", "उसने अपनी टोपी नीचे फेंकी", "वह पेड़ पर चढ़ा", "उसने पुलिस बुलाई"], answer: "उसने अपनी टोपी नीचे फेंकी", answerIndex: 1, explanation: "बंदरों ने उसकी नकल की और टोपियाँ नीचे फेंक दीं।" },
  ],
  matchPairs: [
    { left: "टोपीवाला", right: "रंग-बिरंगी टोपियाँ बेचीं", emoji: "🧑" },
    { left: "बंदर", right: "टोपियाँ ले गए", emoji: "🐒" },
    { left: "बड़ा पेड़", right: "जहाँ वह सोया", emoji: "🌳" },
    { left: "चतुर तरकीब", right: "अपनी टोपी नीचे फेंकी", emoji: "💡" },
  ],
  challenges: [
    { type: "truefalse", prompt: "टोपीवाला बड़े पेड़ के नीचे सोया।", answer: "हाँ, वह बड़े पेड़ के नीचे सोया।", isTrue: true, explanation: "गर्मी थी, इसलिए उसने छाँव में आराम किया।" },
    { type: "flashcard", prompt: "बंदरों ने टोपियाँ नीचे क्यों फेंकीं?", answer: "उन्होंने टोपीवाले की नकल की।", isTrue: true, explanation: "बंदर जो देखते हैं, वही करते हैं।" },
    { type: "truefalse", prompt: "टोपीवाला टोपियाँ लेने पेड़ पर चढ़ा।", answer: "नहीं, उसने अपनी टोपी नीचे फेंकी।", isTrue: false, explanation: "उसने चढ़ने की जगह चतुर तरकीब अपनाई।" },
  ],
};

const gu: Lesson = {
  language: "gu",
  chapterTitle: "ટોપીવાળો અને વાંદરા",
  overview: "એક ટોપીવાળો ઝાડ નીચે સૂઈ જાય છે. તોફાની વાંદરા તેની ટોપીઓ લઈ જાય છે! તે એક હોશિયાર યુક્તિથી ટોપીઓ પાછી મેળવે છે.",
  subtopics: [
    {
      ...en.subtopics[0],
      title: "ટોપીવાળો સૂઈ ગયો",
      sourceContent: "એક માણસ ગામેગામ ટોપીઓ વેચે છે. એક ગરમ દિવસે તે થાકીને મોટા ઝાડ નીચે સૂઈ જાય છે.",
      storyScript:
        "એક હતો ટોપીવાળો.\nતેની પાસે રંગબેરંગી ટોપીઓની મોટી ટોપલી હતી.\nતે ગામેગામ જઈને બોલતો, \"ટોપી લો, ટોપી!\"\nએક દિવસ ખૂબ તડકો હતો.\nતે થાકી ગયો અને એક મોટા છાંયડાવાળા ઝાડ નીચે બેઠો.\nતેણે ટોપલી પોતાની પાસે મૂકી.\nથોડી વારમાં તેને ઊંડી ઊંઘ આવી ગઈ.",
      explanation: "ટોપીવાળો મહેનતથી ટોપીઓ વેચતો હતો. ગરમીથી થાકીને તેણે ઝાડ નીચે આરામ કર્યો.",
      keyPoints: ["માણસ ટોપીઓ વેચતો હતો.", "તે દિવસે ખૂબ ગરમી હતી.", "તે મોટા ઝાડ નીચે સૂઈ ગયો."],
    },
    {
      ...en.subtopics[1],
      title: "તોફાની વાંદરા",
      sourceContent: "ઝાડ પર રહેતા વાંદરા નીચે આવે છે, ટોપલીમાંથી ટોપીઓ લે છે અને પાછા ઉપર ચડી જાય છે.",
      storyScript:
        "તે ઝાડ પર ઘણા વાંદરા રહેતા હતા.\nતેમણે રંગબેરંગી ટોપીઓ જોઈ.\nતેઓ એક પછી એક ચૂપચાપ નીચે ઊતર્યા.\nદરેક વાંદરાએ એક ટોપી લીધી અને પહેરી લીધી.\nપછી તેઓ દોડીને ઝાડ પર ચડી ગયા.\nટોપીવાળો જાગ્યો.\nતેની ટોપલી ખાલી હતી!\nતેણે ઉપર જોયું તો વાંદરા તેની ટોપીઓ પહેરીને બેઠા હતા.",
      explanation: "વાંદરાઓને નકલ કરવી અને રમવું ગમે છે. માણસ સૂતો હતો ત્યારે તેમણે ટોપીઓ લઈ લીધી.",
      keyPoints: ["વાંદરા ઝાડ પર રહેતા હતા.", "વાંદરાઓએ ટોપીઓ લઈ લીધી.", "ટોપલી ખાલી થઈ ગઈ."],
    },
    {
      ...en.subtopics[2],
      title: "એક હોશિયાર યુક્તિ",
      sourceContent: "ટોપીવાળો જે કરે તે વાંદરા કરે છે. તે પોતાની ટોપી નીચે ફેંકે છે, વાંદરા પણ ફેંકે છે, અને તે બધી ટોપીઓ ભેગી કરી લે છે.",
      storyScript:
        "ટોપીવાળાએ વાંદરાઓને મુઠ્ઠી બતાવી.\nવાંદરાઓએ પણ મુઠ્ઠી બતાવી!\nતેણે પોતાનું માથું ખંજવાળ્યું.\nવાંદરાઓએ પણ માથું ખંજવાળ્યું!\nત્યારે તેને એક હોશિયાર યુક્તિ સૂઝી.\nતેણે પોતાની ટોપી જમીન પર ફેંકી.\nવાંદરાઓએ પણ પોતાની ટોપીઓ નીચે ફેંકી.\nતેણે બધી ટોપીઓ ભેગી કરી અને ખુશીથી ઘરે ગયો.",
      explanation: "વાંદરા જે જુએ તેની નકલ કરે છે. ટોપીવાળાએ ગુસ્સાથી નહીં, બુદ્ધિથી કામ લીધું.",
      keyPoints: ["વાંદરા લોકોની નકલ કરે છે.", "તેણે પોતાની ટોપી નીચે ફેંકી.", "શાંતિથી વિચારવાથી ઉકેલ મળે છે."],
    },
  ],
  storyLesson:
    "એક ટોપીવાળા પાસે રંગબેરંગી ટોપીઓની ટોપલી હતી.\nએક ગરમ દિવસે તે મોટા ઝાડ નીચે આરામ કરતાં સૂઈ ગયો.\nઝાડ પરના વાંદરા નીચે આવ્યા અને તેની બધી ટોપીઓ લઈ ગયા.\nતે જાગ્યો ત્યારે ટોપલી ખાલી હતી.\nતેણે જોયું કે વાંદરા ઝાડ પર તેની ટોપીઓ પહેરીને બેઠા છે.\nતેણે મુઠ્ઠી બતાવી, વાંદરાઓએ પણ મુઠ્ઠી બતાવી.\nતેણે માથું ખંજવાળ્યું, વાંદરાઓએ પણ માથું ખંજવાળ્યું.\nત્યારે તેને હોશિયાર યુક્તિ સૂઝી અને તેણે પોતાની ટોપી નીચે ફેંકી.\nવાંદરાઓએ તેની નકલ કરી અને ટોપીઓ પણ નીચે ફેંકી.\nતેણે બધી ટોપીઓ ભેગી કરી અને ખુશીથી ઘરે ગયો.",
  smartNotes:
    "વાર્તાનો માણસ એક **ટોપીવાળો** છે.\nગરમ દિવસે તે **મોટા ઝાડ** નીચે સૂતો.\n**વાંદરાઓએ** તેની ટોપીઓ લઈ લીધી.\nવાંદરા જે જુએ તેની **નકલ** કરે છે.\nતેણે પોતાની **ટોપી નીચે ફેંકી**.\nવાંદરાઓએ ટોપીઓ નીચે ફેંકી અને તેને **બધી પાછી** મળી.\nશીખ: સમસ્યામાં **શાંતિથી વિચારો**.",
  keyWords: [
    { word: "ટોપી", meaning: "માથા પર પહેરવાની વસ્તુ" },
    { word: "વેચનાર", meaning: "જે માણસ વસ્તુઓ વેચે છે" },
    { word: "નકલ", meaning: "બીજા જેવું જ કરવું" },
    { word: "હોશિયાર", meaning: "ઝડપથી સારો વિચાર કરનાર" },
  ],
  quiz: [
    { question: "માણસ શું વેચતો હતો?", options: ["ફળ", "ટોપીઓ", "રમકડાં", "જૂતાં"], answer: "ટોપીઓ", answerIndex: 1, explanation: "તે ટોપીવાળો હતો, તેની પાસે ટોપીઓની ટોપલી હતી." },
    { question: "ટોપીવાળો ક્યાં સૂતો?", options: ["પોતાના ઘરમાં", "હોડીમાં", "મોટા ઝાડ નીચે", "દુકાનમાં"], answer: "મોટા ઝાડ નીચે", answerIndex: 2, explanation: "ગરમી હતી, તેથી તેણે છાંયડાવાળા ઝાડ નીચે આરામ કર્યો." },
    { question: "ટોપીઓ કોણે લીધી?", options: ["વાંદરાઓએ", "પક્ષીઓએ", "બાળકોએ", "બિલાડીઓએ"], answer: "વાંદરાઓએ", answerIndex: 0, explanation: "ઝાડ પર રહેતા વાંદરાઓએ ટોપીઓ લીધી." },
    { question: "વાંદરાઓને શું કરવું ગમે છે?", options: ["આખો દિવસ સૂવું", "ચોપડી વાંચવી", "બીજાની નકલ કરવી", "ટોપી વેચવી"], answer: "બીજાની નકલ કરવી", answerIndex: 2, explanation: "વાંદરા બીજાને જે કરતા જુએ તે જ કરે છે." },
    { question: "ટોપીવાળાને ટોપીઓ પાછી કેવી રીતે મળી?", options: ["તે રડ્યો", "તેણે પોતાની ટોપી નીચે ફેંકી", "તે ઝાડ પર ચડ્યો", "તેણે પોલીસ બોલાવી"], answer: "તેણે પોતાની ટોપી નીચે ફેંકી", answerIndex: 1, explanation: "વાંદરાઓએ તેની નકલ કરી અને ટોપીઓ નીચે ફેંકી." },
  ],
  matchPairs: [
    { left: "ટોપીવાળો", right: "રંગબેરંગી ટોપીઓ વેચી", emoji: "🧑" },
    { left: "વાંદરા", right: "ટોપીઓ લઈ ગયા", emoji: "🐒" },
    { left: "મોટું ઝાડ", right: "જ્યાં તે સૂતો", emoji: "🌳" },
    { left: "હોશિયાર યુક્તિ", right: "પોતાની ટોપી નીચે ફેંકી", emoji: "💡" },
  ],
  challenges: [
    { type: "truefalse", prompt: "ટોપીવાળો મોટા ઝાડ નીચે સૂતો.", answer: "હા, તે મોટા ઝાડ નીચે સૂતો.", isTrue: true, explanation: "ગરમી હતી, તેથી તેણે છાંયડામાં આરામ કર્યો." },
    { type: "flashcard", prompt: "વાંદરાઓએ ટોપીઓ નીચે કેમ ફેંકી?", answer: "તેમણે ટોપીવાળાની નકલ કરી.", isTrue: true, explanation: "વાંદરા જે જુએ તે જ કરે છે." },
    { type: "truefalse", prompt: "ટોપીવાળો ટોપીઓ લેવા ઝાડ પર ચડ્યો.", answer: "ના, તેણે પોતાની ટોપી નીચે ફેંકી.", isTrue: false, explanation: "તેણે ચડવાને બદલે હોશિયાર યુક્તિ વાપરી." },
  ],
};

export const DEMO_LESSONS: Record<Lang, Lesson> = { en, hi, gu };
