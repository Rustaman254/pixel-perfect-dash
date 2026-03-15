import asyncHandler from 'express-async-handler';
import App from '../models/App.js';

// @desc    Get all apps (Admin)
// @route   GET /api/apps
// @access  Admin
export const getApps = asyncHandler(async (req, res) => {
    const apps = await App.findAll();
    res.json(apps);
});

// @desc    Get active apps
// @route   GET /api/apps/active
// @access  Public
export const getActiveApps = asyncHandler(async (req, res) => {
    const apps = await App.findActive();
    res.json(apps);
});

// @desc    Create an app
// @route   POST /api/apps
// @access  Admin
export const createApp = asyncHandler(async (req, res) => {
    const { name, slug, icon, url } = req.body;
    
    if (!name || !slug || !url) {
        res.status(400);
        throw new Error('Name, slug, and URL are required');
    }

    const app = await App.create({ name, slug, icon, url });
    res.status(201).json(app);
});

// @desc    Update an app
// @route   PUT /api/apps/:id
// @access  Admin
export const updateApp = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await App.findById(id);
    
    if (!existing) {
        res.status(404);
        throw new Error('App not found');
    }

    const updated = await App.update(id, { ...existing, ...req.body });
    res.json(updated);
});

// @desc    Delete an app
// @route   DELETE /api/apps/:id
// @access  Admin
export const deleteApp = asyncHandler(async (req, res) => {
    await App.delete(req.params.id);
    res.json({ message: 'App deleted' });
});

// @desc    Toggle app active status
// @route   PUT /api/apps/:id/status
// @access  Admin
export const toggleAppStatus = asyncHandler(async (req, res) => {
    const { isActive } = req.body;
    await App.toggleActive(req.params.id, isActive);
    res.json({ message: `App ${isActive ? 'activated' : 'deactivated'}` });
});
