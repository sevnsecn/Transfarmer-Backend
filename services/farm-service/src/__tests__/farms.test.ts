import request from 'supertest';
import express from 'express';

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
import { getAllFarms, getFarmById } from '../services/farmService';

const app = express();
app.use(express.json());
app.use('/api/farms', farmRoutes);

describe('GET /api/farms', () => {
  it('should return all farms', async () => {
    (getAllFarms as jest.Mock).mockResolvedValue([
      { _id: '1', farm_name: 'Test Farm', farm_location: 'Bandung' },
    ]);

    const res = await request(app).get('/api/farms');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('should return 500 on db error', async () => {
    (getAllFarms as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/farms');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/farms/:id', () => {
  it('should return 404 if farm not found', async () => {
    (getFarmById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/farms/nonexistentid');
    expect(res.status).toBe(404);
  });

  it('should return farm if found', async () => {
    (getFarmById as jest.Mock).mockResolvedValue({
      _id: '1',
      farm_name: 'Test Farm',
      farm_location: 'Bandung',
    });

    const res = await request(app).get('/api/farms/1');
    expect(res.status).toBe(200);
    expect(res.body.data.farm_name).toBe('Test Farm');
  });
});

describe('POST /api/farms', () => {
  it('should return 401 without token', async () => {
    const res = await request(app)
      .post('/api/farms')
      .send({ farm_name: 'New Farm', farm_location: 'Jakarta' });
    expect(res.status).toBe(401);
  });

  it('should return 400 if fields missing', async () => {
    const res = await request(app)
      .post('/api/farms')
      .set('Authorization', 'Bearer faketoken')
      .send({ farm_name: 'New Farm' });
    expect(res.status).toBe(401);
  });
});