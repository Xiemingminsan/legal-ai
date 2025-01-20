// src/routes/stemmerRoutes.js
const express = require('express');
const router = express.Router();
const { stateOfTheArtAmharicStemmer } = require('../helpers/amh_stemmer'); 
console.log('State of the Art Amharic Stemmer:', typeof stateOfTheArtAmharicStemmer); // Should log 'function'

router.post('/stem', (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ msg: 'Text is required' });
    }

    console.log('Text:', text);

    try {
        const stemmedText = stateOfTheArtAmharicStemmer(text); // Correct function call
        console.log('Stemmed Text:', stemmedText);
        return res.json({ stemmedText });
    } catch (error) {
        console.error('Error in stemming:', error.message);
        return res.status(500).json({ msg: 'Server error in stemming text' });
    }
});

module.exports = router;
