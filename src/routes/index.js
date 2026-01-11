import express from 'express';
import { upsertLink, getLinks, redirectLink, toggleLinkStatus } from '../controllers/linkController.js';

const router = express.Router();

// API Routes
router.post('/api/links', upsertLink);
router.get('/api/links', getLinks);
router.put('/api/links/:id/toggle', toggleLinkStatus);

// Redirect Route (Catch-all for shortcodes, strictly needs to be checked last or separate)
// We'll export this and mount it appropriately in server.js
// Actually, it's better to keep API separate.
// We will mount this router at root '/' in server.js, but handle conflicts carefully.

router.get('/:code', redirectLink);

export default router;
