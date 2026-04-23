'use strict';

/**
 * Public routes — no authentication required.
 * Currently handles leader/admin applications from the landing page.
 */

const router = require('express').Router();
const adminRequestService = require('../services/adminRequest.service');
const { created } = require('../utils/response');

/**
 * POST /api/public/leader-applications
 * Submit a request to become an Iqub leader / admin.
 * Anyone can call this from the public landing page.
 */
router.post('/leader-applications', async (req, res, next) => {
  try {
    const { fullName, email, phone, location, message, preferredContactMethod } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ success: false, message: 'Full name and email are required.' });
    }

    const request = await adminRequestService.submitApplication({
      fullName, email, phone, location, message, preferredContactMethod,
    });

    return created(res, request, 'Application submitted successfully. We will review and get back to you soon.');
  } catch (err) { next(err); }
});

module.exports = router;
