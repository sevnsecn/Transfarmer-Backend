process.env.JWT_SECRET = 'test-secret';

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.mock('../lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
}));

jest.mock('../services/farmService', () => ({
  getAllFarms: jest.fn(),
  getFarmById: jest.fn(),
  createFarm: jest.fn(),
  updateFarm: jest.fn(),
  deleteFarm: jest.fn(),
}));

import farmRoutes from '../routes/farms';
import { getAllFarms, getFarmById, createFarm, updateFarm, deleteFarm } from '../services/farmService';

const app = express();
app.use(express.json());
app.use('/api/farms', farmRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function makeToken(isAdmin: boolean) {
  return jwt.sign({ id: 'user1', is_admin: isAdmin }, JWT_SECRET);
}

// ── GET ALL ────────────────────────────────────────────────────────────────────

describe('GET /api/farms', () => {
  it('should return all farms', async () => {
    (getAllFarms as jest.Mock).mockResolvedValue([
      { _id: '1', farm_name: 'Test Farm', farm_location: 'Bandung' },
    ]);

    const res = await request(app).get('/api/farms');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.count).toBe(1);
  });

  it('should return empty array when no farms exist', async () => {
    (getAllFarms as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/api/farms');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('should return 500 on db error', async () => {
    (getAllFarms as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/farms');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── GET BY ID ──────────────────────────────────────────────────────────────────

describe('GET /api/farms/:id', () => {
  it('should return farm if found', async () => {
    (getFarmById as jest.Mock).mockResolvedValue({
      _id: '1',
      farm_name: 'Test Farm',
      farm_location: 'Bandung',
    });

    const res = await request(app).get('/api/farms/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.farm_name).toBe('Test Farm');
  });

  it('should return 404 if farm not found', async () => {
    (getFarmById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/farms/nonexistentid');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ── POST ───────────────────────────────────────────────────────────────────────

describe('POST /api/farms', () => {
  it('should return 401 without token', async () => {
    const res = await request(app)
      .post('/api/farms')
      .send({ farm_name: 'New Farm', farm_location: 'Jakarta' });
    expect(res.status).toBe(401);
  });

  it('should return 403 if user is not admin', async () => {
    const res = await request(app)
      .post('/api/farms')
      .set('Authorization', `Bearer ${makeToken(false)}`)
      .send({ farm_name: 'New Farm', farm_location: 'Jakarta' });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if farm_name is missing', async () => {
    const res = await request(app)
      .post('/api/farms')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .send({ farm_location: 'Jakarta' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if farm_location is missing', async () => {
    const res = await request(app)
      .post('/api/farms')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .send({ farm_name: 'New Farm' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 201 on valid create by admin', async () => {
    (createFarm as jest.Mock).mockResolvedValue({
      _id: '1',
      farm_name: 'New Farm',
      farm_location: 'Jakarta',
    });

    const res = await request(app)
      .post('/api/farms')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .send({ farm_name: 'New Farm', farm_location: 'Jakarta' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.farm_name).toBe('New Farm');
  });
});

// ── PUT ────────────────────────────────────────────────────────────────────────

describe('PUT /api/farms/:id', () => {
  it('should return 401 without token', async () => {
    const res = await request(app)
      .put('/api/farms/1')
      .send({ farm_name: 'Updated Farm' });
    expect(res.status).toBe(401);
  });

  it('should return 403 if user is not admin', async () => {
    const res = await request(app)
      .put('/api/farms/1')
      .set('Authorization', `Bearer ${makeToken(false)}`)
      .send({ farm_name: 'Updated Farm' });
    expect(res.status).toBe(403);
  });

  it('should return 404 if farm not found', async () => {
    (updateFarm as jest.Mock).mockRejectedValue(new Error('Farm not found'));

    const res = await request(app)
      .put('/api/farms/badid')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .send({ farm_name: 'Updated Farm' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 on valid update by admin', async () => {
    (updateFarm as jest.Mock).mockResolvedValue({
      _id: '1',
      farm_name: 'Updated Farm',
      farm_location: 'Bandung',
    });

    const res = await request(app)
      .put('/api/farms/1')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .send({ farm_name: 'Updated Farm' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.farm_name).toBe('Updated Farm');
  });
});

// ── DELETE ─────────────────────────────────────────────────────────────────────

describe('DELETE /api/farms/:id', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).delete('/api/farms/1');
    expect(res.status).toBe(401);
  });

  it('should return 403 if user is not admin', async () => {
    const res = await request(app)
      .delete('/api/farms/1')
      .set('Authorization', `Bearer ${makeToken(false)}`);
    expect(res.status).toBe(403);
  });

  it('should return 404 if farm not found', async () => {
    (deleteFarm as jest.Mock).mockRejectedValue(new Error('Farm not found'));

    const res = await request(app)
      .delete('/api/farms/badid')
      .set('Authorization', `Bearer ${makeToken(true)}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 on valid delete by admin', async () => {
    (deleteFarm as jest.Mock).mockResolvedValue({ _id: '1' });

    const res = await request(app)
      .delete('/api/farms/1')
      .set('Authorization', `Bearer ${makeToken(true)}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});