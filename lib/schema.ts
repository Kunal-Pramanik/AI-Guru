// JSON Schemas passed to Gemini (responseJsonSchema). Kept in one place so the
// prepare and translate routes always agree on structure.

const s = { type: "string" } as const;
const strArr = { type: "array", items: s } as const;

export const lessonSchema = {
  type: "object",
  properties: {
    chapterTitle: s,
    overview: s,
    subtopics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: s,
          sourceContent: s,
          storyScript: s,
          visualDescription: s,
          explanation: s,
          keyPoints: strArr,
          emoji: s,
        },
        required: ["title", "sourceContent", "storyScript", "visualDescription", "explanation", "keyPoints", "emoji"],
      },
    },
    storyLesson: s,
    smartNotes: strArr,
    keyWords: {
      type: "array",
      items: { type: "object", properties: { word: s, meaning: s }, required: ["word", "meaning"] },
    },
    quiz: {
      type: "array",
      items: {
        type: "object",
        properties: { question: s, options: strArr, answer: s, explanation: s },
        required: ["question", "options", "answer", "explanation"],
      },
    },
    matchPairs: {
      type: "array",
      items: {
        type: "object",
        properties: { left: s, right: s, emoji: s },
        required: ["left", "right", "emoji"],
      },
    },
    challenges: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["truefalse", "flashcard"] },
          prompt: s,
          answer: s,
          isTrue: { type: "boolean" },
          explanation: s,
        },
        required: ["type", "prompt", "answer", "isTrue", "explanation"],
      },
    },
  },
  required: ["chapterTitle", "overview", "subtopics", "storyLesson", "smartNotes", "keyWords", "quiz", "matchPairs", "challenges"],
};

export const translationSchema = {
  type: "object",
  properties: {
    chapterTitle: s,
    overview: s,
    storyLesson: s,
    smartNotes: s,
    subtopics: {
      type: "array",
      items: {
        type: "object",
        properties: { title: s, sourceContent: s, storyScript: s, explanation: s, keyPoints: strArr },
        required: ["title", "sourceContent", "storyScript", "explanation", "keyPoints"],
      },
    },
    keyWords: {
      type: "array",
      items: { type: "object", properties: { word: s, meaning: s }, required: ["word", "meaning"] },
    },
    quiz: {
      type: "array",
      items: {
        type: "object",
        properties: { question: s, options: strArr, explanation: s },
        required: ["question", "options", "explanation"],
      },
    },
    matchPairs: {
      type: "array",
      items: { type: "object", properties: { left: s, right: s }, required: ["left", "right"] },
    },
    challenges: {
      type: "array",
      items: {
        type: "object",
        properties: { prompt: s, answer: s, explanation: s },
        required: ["prompt", "answer", "explanation"],
      },
    },
  },
  required: ["chapterTitle", "overview", "storyLesson", "smartNotes", "subtopics", "keyWords", "quiz", "matchPairs", "challenges"],
};

export const LANGUAGE_NAMES = { en: "English", hi: "Hindi (हिंदी, Devanagari script)", gu: "Gujarati (ગુજરાતી, Gujarati script)" } as const;
