import Tesseract from 'tesseract.js';
import fs from 'fs';

fs.readFile('./jp.jpg', (err, data) => {

    Tesseract.recognize(
        data,
        'jpn',
        { logger: m => console.log(m) }
    ).then(({ data: { text } }) => {
        console.log(text);
    })
});