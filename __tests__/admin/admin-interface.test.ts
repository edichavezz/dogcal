/**
 * Integration Tests for Admin Interface
 *
 * Tests the admin interface for creating users and pups
 */

import { describe, it, expect } from 'vitest';

const API_BASE = process.env.TEST_API_BASE || 'http://localhost:3000';

describe('Admin Interface Integration Tests', () => {
  describe('Create Owner Flow', () => {
    it('should create owner via admin interface', async () => {
      // Simulate form submission from admin interface
      const ownerData = {
        name: 'Integration Test Owner',
        role: 'OWNER',
        phoneNumber: '+1234567890',
        profilePhotoUrl: 'https://example.com/photo.jpg',
        address: '123 Test St',
      };

      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user.name).toBe(ownerData.name);
      expect(data.user.phoneNumber).toBe(ownerData.phoneNumber);

      // Verify user appears in the list
      const listResponse = await fetch(`${API_BASE}/api/users`);
      const listData = await listResponse.json();
      const createdUser = listData.users.find((u: any) => u.name === ownerData.name);
      expect(createdUser).toBeDefined();
      expect(createdUser.role).toBe('OWNER');
    });

    it('should handle empty form fields gracefully', async () => {
      // Simulate user submitting form with only name filled
      const ownerData = {
        name: 'Minimal Owner Test',
        role: 'OWNER',
        phoneNumber: '',
        profilePhotoUrl: '',
        address: '',
      };

      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user.name).toBe(ownerData.name);
      expect(data.user.phoneNumber).toBeNull();
      expect(data.user.profilePhotoUrl).toBeNull();
      expect(data.user.address).toBeNull();
    });
  });

  describe('Create Friend Flow', () => {
    let ownerId: string;
    let pupId: string;

    it('should set up test data', async () => {
      // Create an owner first
      const ownerResponse = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Friend Test Owner',
          role: 'OWNER',
        }),
      });

      const ownerData = await ownerResponse.json();
      ownerId = ownerData.user.id;

      // Create a pup
      const pupResponse = await fetch(`${API_BASE}/api/pups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Friend Test Pup',
          ownerUserId: ownerId,
        }),
      });

      const pupData = await pupResponse.json();
      pupId = pupData.pup.id;

      expect(ownerId).toBeDefined();
      expect(pupId).toBeDefined();
    });

    it('should create friend via admin interface', async () => {
      const friendData = {
        name: 'Integration Test Friend',
        role: 'FRIEND',
        phoneNumber: '+9876543210',
        profilePhotoUrl: null,
        address: null,
      };

      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(friendData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user.name).toBe(friendData.name);
      expect(data.user.role).toBe('FRIEND');

      // Create friendship with pup
      const friendshipResponse = await fetch(`${API_BASE}/api/pups/${pupId}/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendUserId: data.user.id,
        }),
      });

      expect(friendshipResponse.status).toBe(201);
    });

    it('should handle friend creation with empty optional fields', async () => {
      const friendData = {
        name: 'Minimal Friend Test',
        role: 'FRIEND',
        phoneNumber: '',
        profilePhotoUrl: '',
        address: '',
      };

      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(friendData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user.phoneNumber).toBeNull();
      expect(data.user.profilePhotoUrl).toBeNull();
      expect(data.user.address).toBeNull();
    });
  });

  describe('Create Pup Flow', () => {
    let ownerId: string;

    it('should set up owner', async () => {
      const ownerResponse = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Pup Test Owner',
          role: 'OWNER',
        }),
      });

      const ownerData = await ownerResponse.json();
      ownerId = ownerData.user.id;
      expect(ownerId).toBeDefined();
    });

    it('should create pup with all fields', async () => {
      const pupData = {
        name: 'Integration Test Pup',
        breed: 'Golden Retriever',
        profilePhotoUrl: 'https://example.com/pup.jpg',
        careInstructions: 'Needs walks twice daily',
        ownerUserId: ownerId,
      };

      const response = await fetch(`${API_BASE}/api/pups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pupData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.pup.name).toBe(pupData.name);
      expect(data.pup.breed).toBe(pupData.breed);
      expect(data.pup.ownerUserId).toBe(ownerId);
    });

    it('should create pup with only required fields', async () => {
      const pupData = {
        name: 'Minimal Pup Test',
        ownerUserId: ownerId,
      };

      const response = await fetch(`${API_BASE}/api/pups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pupData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.pup.name).toBe(pupData.name);
      expect(data.pup.ownerUserId).toBe(ownerId);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid URLs', async () => {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Invalid URL Test',
          role: 'OWNER',
          profilePhotoUrl: 'not-a-url',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid data');
    });

    it('should reject missing required fields', async () => {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'OWNER',
          // Missing name
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject invalid role', async () => {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          role: 'INVALID_ROLE',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Data Retrieval', () => {
    it('should fetch all users', async () => {
      const response = await fetch(`${API_BASE}/api/users`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
    });

    it('should fetch all pups', async () => {
      const response = await fetch(`${API_BASE}/api/pups`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.pups).toBeDefined();
      expect(Array.isArray(data.pups)).toBe(true);
    });
  });
});
