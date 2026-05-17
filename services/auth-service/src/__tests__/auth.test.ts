process.env.JWT_SECRET = 'test-secret';

import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';

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

// ── SIGNUP ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/signup', () => {
  it('should return 400 if all fields are missing', async () => {
    const res = await request(app).post('/api/auth/signup').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if user_name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ user_email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ user_name: 'test', user_email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ user_name: 'test', user_email: 'notanemail', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ user_name: 'test', user_email: 'test@test.com', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for password with only numbers (no letter or symbol)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ user_name: 'test', user_email: 'test@test.com', password: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if email already exists', async () => {
    (createUser as jest.Mock).mockRejectedValue(new Error('Email already exists'));

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ user_name: 'test', user_email: 'dupe@test.com', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email already exists');
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

// ── LOGIN ──────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('should return 401 if user not found', async () => {
    (findUserByEmail as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ user_email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for wrong password', async () => {
    (findUserByEmail as jest.Mock).mockResolvedValue({
      _id: 'abc123',
      user_email: 'test@test.com',
      password_hash: await bcrypt.hash('correctpassword', 10),
      is_admin: false,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ user_email: 'test@test.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 with token on valid login', async () => {
    const password = 'password123';
    const password_hash = await bcrypt.hash(password, 10);

    (findUserByEmail as jest.Mock).mockResolvedValue({
      _id: 'abc123',
      user_name: 'test',
      user_email: 'test@test.com',
      password_hash,
      is_admin: false,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ user_email: 'test@test.com', password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.user_email).toBe('test@test.com');
  });

  it('should return is_admin true for admin user', async () => {
    const password = 'adminpass1';
    const password_hash = await bcrypt.hash(password, 10);

    (findUserByEmail as jest.Mock).mockResolvedValue({
      _id: 'admin1',
      user_name: 'admin',
      user_email: 'admin@test.com',
      password_hash,
      is_admin: true,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ user_email: 'admin@test.com', password });
    expect(res.status).toBe(200);
    expect(res.body.user.is_admin).toBe(true);
  });
});