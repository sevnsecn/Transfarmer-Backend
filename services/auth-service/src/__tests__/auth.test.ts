import request from 'supertest';
import express from 'express';

jest.mock('../lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
}));

jest.mock('../services/userService', () => ({
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
}));

import authRoutes from '../routes/auth';
import { createUser, findUserByEmail } from '../services/userService';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('POST /api/auth/signup', () => {
  it('should return 400 if fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ user_email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ user_name: 'test', user_email: 'notanemail', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('should return 400 for short password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ user_name: 'test', user_email: 'test@test.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('should return 201 on valid signup', async () => {
    (createUser as jest.Mock).mockResolvedValue({
      _id: 'abc123',
      user_name: 'test',
      user_email: 'test@test.com',
    });

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ user_name: 'test', user_email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  it('should return 401 if user not found', async () => {
    (findUserByEmail as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ user_email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('should return 401 for wrong password', async () => {
    (findUserByEmail as jest.Mock).mockResolvedValue({
      _id: 'abc123',
      user_email: 'test@test.com',
      password_hash: 'wronghash',
      is_admin: false,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ user_email: 'test@test.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });
});