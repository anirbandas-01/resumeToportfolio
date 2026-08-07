const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Resume = require('../models/Resume');
const { parseResumeWithAI } = require('../services/llmService');

/* async function extractText(file){
    if(file.mimetype === 'application/pdf') {
        const data = await pdfParse(file.buffer);
        return data.text;
    } else {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return result.value;
    }
} */

async function extractText(file) {
  if (file.mimetype === 'application/pdf') {
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: file.buffer });
    const result = await parser.getText();
    return result.text;
  } else {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }
}

async function uploadResume(req, res){
    try {
        if(!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const rawText = await extractText(req.file);

        if(!rawText || rawText.trim().length < 20) {
            return res.status(422).json({ error: 'Could not read readable text from this file' });
        }

        const resume = await Resume.create({ 
            userId: req.user.id,
            rawText,
        });

        res.status(201).json({
            resumeId: resume._id,
            rawText: resume.rawText,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to process the uploaded file' });
    }
}

async function parseResume(req, res) {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });

        if(!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        let parsedData;
        try {
            parsedData = await parseResumeWithAI(resume.rawText);
        } catch (aiError) {
            return res.status(200).json({
                parsed: false,
                message: 'AI parsing failed. You can fill in your details manually.',
            });
        }

        resume.parsedData = parsedData;
        await resume.save();

        res.status(200).json({ parsed: true, parsedData });
    } catch (err) {
        res.status(500).json({ error: 'Something went wrong while parsing the resume' });
    }
}


async function getResume(req, res){
    try {
        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });

        if(!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        res.json({ resume });
    } catch (err) {
        res.status(500).json({ error: 'Something went wrong' });
    }
}


async function updateResume(req, res) {
    try {
        const { parsedData, theme } = req.body;

        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
        if(!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        if (parsedData !== undefined) resume.parsedData = parsedData;
        if (theme !== undefined) resume.theme = theme;
        
        await resume.save();

        res.json({ resume });
    } catch (err) {
        res.status(500).json({ error: 'Something went wrong while saving changes' });
    }
}

module.exports = { uploadResume, parseResume, getResume, updateResume };