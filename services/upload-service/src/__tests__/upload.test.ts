process.env.JWT_SECRET = 'test-secret';

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn((options: any, cb: any) => {
        cb(null, { secure_url: 'https://res.cloudinary.com/test/image.jpg' });
        return { end: jest.fn() };
      }),
    },
    config: jest.fn(),
  },
}));

// Mock auth middleware to allow controlling admin status per test
jest.mock('../middleware/auth', () => ({
  requireAdmin: jest.fn((req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    try {
      const token = authHeader.split(' ')[1];
      const decoded: any = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your-secret-key');
      if (!decoded.is_admin) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  }),
}));

import uploadRoutes from '../routes/upload/image';

const app = express();
app.use(express.json());
app.use('/api/upload/image', uploadRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function makeToken(isAdmin: boolean) {
  return jwt.sign({ id: 'user1', is_admin: isAdmin }, JWT_SECRET);
}

// ── UPLOAD ─────────────────────────────────────────────────────────────────────

describe('POST /api/upload/image', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).post('/api/upload/image');
    expect(res.status).toBe(401);
  });

  it('should return 403 if user is not admin', async () => {
    const res = await request(app)
      .post('/api/upload/image')
      .set('Authorization', `Bearer ${makeToken(false)}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if no file provided', async () => {
    const res = await request(app)
      .post('/api/upload/image')
      .set('Authorization', `Bearer ${makeToken(true)}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 with url when file uploaded by admin', async () => {
    const res = await request(app)
      .post('/api/upload/image')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .attach('image', Buffer.from('fake image content'), 'test.jpg');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.url).toBe('https://res.cloudinary.com/test/image.jpg');
  });

  it('should return 500 if cloudinary fails', async () => {
    const { v2: cloudinary } = require('cloudinary');
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementationOnce(
      (options: any, cb: any) => {
        cb(new Error('Cloudinary error'), null);
        return { end: jest.fn() };
      }
    );

    const res = await request(app)
      .post('/api/upload/image')
      .set('Authorization', `Bearer ${makeToken(true)}`)
      .attach('image', Buffer.from('fake image content'), 'test.jpg');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});