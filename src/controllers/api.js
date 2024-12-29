import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const apiStatus = (req, res) => {
    const filePath = path.join(__dirname, '../../');
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(500).send('An error occurred while loading the page.');
        }
    });
};