import express from 'express';
import { upsertLink, getLinks, redirectLink, toggleLinkStatus } from '../controllers/linkController.js';
import { registerUser, loginUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Auth Routes
// router.post('/api/auth/register', registerUser); // Disabled public registration
router.post('/api/auth/login', loginUser);

// API Routes
router.post('/api/links', upsertLink); // Public for script access (as requested)
router.get('/api/links', protect, getLinks); // Protected List (Dashboard only)
router.put('/api/links/:id/toggle', protect, toggleLinkStatus);


// Redirect Route (Catch-all for shortcodes, strictly needs to be checked last or separate)
// We'll export this and mount it appropriately in server.js
// Actually, it's better to keep API separate.
// We will mount this router at root '/' in server.js, but handle conflicts carefully.

router.get('/:code', redirectLink);

export default router;
