const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EXTRACTION_PROMPT = `You are a resume parser. Extract structured information from the resume text below and return ONLY valid JSON (no markdown, no code fences, no explanation) matching this exact shape: 
 {
  "name":  "string",
  "email": "string",
  "phone": "string",
  "summary": "string",
  "skills": ["string"],
  "experience": [
    {"title": "string", "company": "string", "duration": "string", "description": "string" }
    ],
    "education": [
    { "degree": "string", "institution":"string", "duration":"string" }
    ],
    "projects": [
     {"name": "string", "description": "string", "technologies": ["string"]}
     ],
     "certifications": ["string"]
     }
     
     
     Rules:
     - If a section does't exist in the resume, use an empty array [] or empty string "" -never in vent information.
     - Keep description concise, based only on what's written.- Return raw JSON only, nothing else.
     

     Resume text:
     """
     {{RESUME_TEXT}}
     """`;

     async function parseResumeWithAI(rawText){
        const prompt = EXTRACTION_PROMPT.replace('{{RESUME_TEXT}}', rawText);

        const controller = new AbortController();
        const timeout = setTimeout(()=> controller.abort(), 20000);

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash-lite',
                contents: prompt,
            });

            clearTimeout(timeout);

            const text = response.text.trim();

            const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();

            return JSON.parse(cleaned);
        } catch (err) {
            clearTimeout(timeout);
            throw new Error('AI parsing failed:' + err.message);
        }
     }

     module.exports = {parseResumeWithAI};