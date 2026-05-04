import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

const isProjectMember = (project, userId) =>
  project.members.some((memberId) => String(memberId) === String(userId));

router.get('/', protect, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'Admin') {
      const projects = await Project.find({ owner: req.user._id });
      const projectIds = projects.map(p => p._id);
      tasks = await Task.find({ project: { $in: projectIds } })
        .populate('assignedTo', 'name')
        .populate('project', 'name');
    } else {
      tasks = await Task.find({ assignedTo: req.user._id })
        .populate('assignedTo', 'name')
        .populate('project', 'name');
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const canAccess =
      req.user.role === 'Admin' ||
      String(project.owner) === String(req.user._id) ||
      isProjectMember(project, req.user._id);

    if (!canAccess) {
      return res.status(403).json({ message: 'Not authorized to view these tasks' });
    }

    const tasks = await Task.find({ project: req.params.projectId }).populate('assignedTo', 'name');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, description, dueDate, project, assignedTo } = req.body;

    if (!title?.trim() || !project) {
      return res.status(400).json({ message: 'Task title and project are required' });
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (String(projectDoc.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the project owner can create tasks' });
    }

    if (assignedTo && !isProjectMember(projectDoc, assignedTo)) {
      return res.status(400).json({ message: 'Task can only be assigned to a project member' });
    }

    const task = new Task({
      title: title.trim(),
      description: description?.trim() || '',
      dueDate,
      project,
      assignedTo
    });
    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwnerAdmin =
      req.user.role === 'Admin' && String(project.owner) === String(req.user._id);
    const isAssignedMember = String(task.assignedTo) === String(req.user._id);

    if (!isOwnerAdmin && !isAssignedMember) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    if (req.body.status) {
      const allowedStatuses = ['Pending', 'In Progress', 'Completed'];
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: 'Invalid task status' });
      }
      task.status = req.body.status;
    }

    if (isOwnerAdmin) {
      if (req.body.title !== undefined) {
        if (!req.body.title.trim()) {
          return res.status(400).json({ message: 'Task title cannot be empty' });
        }
        task.title = req.body.title.trim();
      }

      if (req.body.description !== undefined) {
        task.description = req.body.description.trim();
      }

      if (req.body.dueDate !== undefined) {
        task.dueDate = req.body.dueDate || null;
      }

      if (req.body.assignedTo !== undefined) {
        if (req.body.assignedTo && !isProjectMember(project, req.body.assignedTo)) {
          return res.status(400).json({ message: 'Task can only be assigned to a project member' });
        }
        task.assignedTo = req.body.assignedTo || null;
      }
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project || String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the project owner can delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
