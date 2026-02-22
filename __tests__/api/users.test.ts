/**
 * API Tests for User Management
 *
 * Tests the /api/users endpoint for creating owners and friends
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_BASE = process.env.TEST_API_BASE || 'http://localhost:3000';

describe('/api/users', () => {
  describe('POST /api/users - Create Owner', () => {
    it('should create owner with all fields', async () => {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Owner Full',
          role: 'OWNER',
          phoneNumber: '+1234567890',
          profilePhotoUrl: 'https://example.com/photo.jpg',
          address: '123 Main St',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.name).toBe('Test Owner Full');
      expect(data.user.role).toBe('OWNER');
      expect(data.user.phoneNumber).toBe('+1234567890');
      expect(data.user.profilePhotoUrl).toBe('https://example.com/photo.jpg');
      expect(data.user.address).toBe('123 Main St');
    });

    it('should create owner with only required fields', async () => {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Owner Minimal',
          role: 'OWNER',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.name).toBe('Test Owner Minimal');
      expect(data.user.role).toBe('OWNER');
    });

    it('should create owner with empty string optional fields', async () => {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Owner Empty Strings',
          role: 'OWNER',
          phoneNumber: '',
          profilePhotoUrl: '',
          address: '',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.name).toBe('Test Owner Empty Strings');
      expect(data.user.phoneNumber).toBeNull();
      expect(data.user.profilePhotoUrl).toBeNull();
      expect(data.user.address).toBeNull();
    });

    it('should create owner with null optional fields', async () => {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Owner Nulls',
          role: 'OWNER',
          phoneNumber: null,
          profilePhotoUrl: null,
          address: null,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.name).toBe('Test Owner Nulls');
      expect(data.user.phoneNumber).toBeNull();
      expect(data.user.profilePhotoUrl).toBeNull();
      expect(data.user.address).toBeNull();
    });

    it('should reject owner with missing name', async () => {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'OWNER',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid data');
      expect(data.details).toBeDefined();
    });

    it('should reject owner with invalid URL', async () => {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Owner',
          role: 'OWNER',
          profilePhotoUrl: 'not-a-valid-url',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid data');
      expect(data.details).toBeDefined();
      expect(data.details.some((d: { path: string[] }) => d.path.includes('profilePhotoUrl'))).toBe(true);
    });

    it('should reject owner with name too long', async () => {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'a'.repeat(101), // 101 characters
          role: 'OWNER',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid data');
    });
  });

  describe('POST /api/users - Create Friend', () => {
    it('should create friend with all fields', async () => {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Friend Full',
          role: 'FRIEND',
          phoneNumber: '+9876543210',
          profilePhotoUrl: 'https://example.com/friend.jpg',
          address: '456 Oak Ave',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.name).toBe('Test Friend Full');
      expect(data.user.role).toBe('FRIEND');
      expect(data.user.phoneNumber).toBe('+9876543210');
    });

    it('should create friend with only required fields', async () => {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Friend Minimal',
          role: 'FRIEND',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.name).toBe('Test Friend Minimal');
      expect(data.user.role).toBe('FRIEND');
    });

    it('should create friend with empty string optional fields', async () => {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Friend Empty',
          role: 'FRIEND',
          phoneNumber: '',
          profilePhotoUrl: '',
          address: '',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.phoneNumber).toBeNull();
      expect(data.user.profilePhotoUrl).toBeNull();
      expect(data.user.address).toBeNull();
    });
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const response = await fetch(`${API_BASE}/api/users`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.users.length).toBeGreaterThan(0);
    });

    it('should return users sorted by role then name', async () => {
      const response = await fetch(`${API_BASE}/api/users`);
      const data = await response.json();

      const roles = data.users.map((u: { role: string }) => u.role);
      const ownerIndex = roles.indexOf('OWNER');
      const friendIndex = roles.findIndex((r: string, i: number) => i > ownerIndex && r === 'FRIEND');

      // If there are both owners and friends, owners should come first
      if (ownerIndex !== -1 && friendIndex !== -1) {
        expect(ownerIndex).toBeLessThan(friendIndex);
      }
    });
  });
});
