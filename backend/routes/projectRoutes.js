import express from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

const isProjectMember = (project, userId) =>
  project.members.some((memberId) => String(memberId._id || memberId) === String(userId));

router.get('/', protect, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'Admin') {
      projects = await Project.find({}).populate('owner', 'name').populate('members', 'name');
    } else {
      projects = await Project.find({ members: req.user._id }).populate('owner', 'name').populate('members', 'name');
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description, members } = req.body;

    if (!name?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'Project name and description are required' });
    }

    const incomingMembers = Array.isArray(members) ? members : [];
    const uniqueMembers = [...new Set([...incomingMembers, String(req.user._id)])];

    if (uniqueMembers.some((memberId) => !mongoose.Types.ObjectId.isValid(memberId))) {
      return res.status(400).json({ message: 'One or more team members are invalid' });
    }

    const memberUsers = await User.find({
      _id: { $in: uniqueMembers },
      role: { $in: ['Admin', 'Member'] }
    }).select('_id');

    if (memberUsers.length !== uniqueMembers.length) {
      return res.status(400).json({ message: 'One or more team members were not found' });
    }

    const project = new Project({
      name: name.trim(),
      description: description.trim(),
      owner: req.user._id,
      members: uniqueMembers
    });
    const createdProject = await project.save();
    res.status(201).json(createdProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name').populate('members', 'name');
    if (project) {
      const canAccess =
        req.user.role === 'Admin' ||
        String(project.owner._id) === String(req.user._id) ||
        isProjectMember(project, req.user._id);

      if (!canAccess) {
        return res.status(403).json({ message: 'Not authorized to view this project' });
      }

      res.json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the project owner can manage this project' });
    }

    const { name, description, members } = req.body;
    const incomingMembers = Array.isArray(members) ? members : project.members.map((memberId) => String(memberId));
    const uniqueMembers = [...new Set([...incomingMembers, String(req.user._id)])];

    if (uniqueMembers.some((memberId) => !mongoose.Types.ObjectId.isValid(memberId))) {
      return res.status(400).json({ message: 'One or more team members are invalid' });
    }

    const memberUsers = await User.find({
      _id: { $in: uniqueMembers },
      role: { $in: ['Admin', 'Member'] }
    }).select('_id');

    if (memberUsers.length !== uniqueMembers.length) {
      return res.status(400).json({ message: 'One or more team members were not found' });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'Project name cannot be empty' });
      }
      project.name = name.trim();
    }

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({ message: 'Project description cannot be empty' });
      }
      project.description = description.trim();
    }

    project.members = uniqueMembers;

    const updatedProject = await project.save();
    await updatedProject.populate('owner', 'name');
    await updatedProject.populate('members', 'name');

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
