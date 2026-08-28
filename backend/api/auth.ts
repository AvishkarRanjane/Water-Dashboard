/**
 * AquaWatch API - Authentication & Role-Based Access Control
 * Roles: 'admin', 'utility_staff', 'viewer'
 */

import { Router } from 'express';
import { DataStore } from '../db/in_memory_store';

const router = Router();

// Current active session user (mock token session for demo)
let currentSessionUser = DataStore.users[0]; // defaults to Admin

router.get('/me', (req, res) => {
  res.json({
    user: currentSessionUser,
    available_users: DataStore.users
  });
});

router.post('/switch-user', (req, res) => {
  const { user_id } = req.body;
  const found = DataStore.users.find(u => u.user_id === user_id);
  if (!found) {
    return res.status(404).json({ error: 'User not found' });
  }
  currentSessionUser = found;
  res.json({ success: true, user: currentSessionUser });
});

router.get('/users', (req, res) => {
  res.json(DataStore.users);
});

router.post('/users', (req, res) => {
  const { name, email, role, zone_access, department } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const newUser = {
    user_id: `usr-${Date.now()}`,
    name,
    email,
    role: role || 'utility_staff',
    zone_access: zone_access || ['ALL'],
    department: department || 'Water Operations',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  };
  DataStore.users.push(newUser);
  res.status(201).json(newUser);
});

export default router;
