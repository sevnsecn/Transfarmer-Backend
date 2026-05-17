import request from 'supertest';
import express from 'express';

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

jest.mock('../middleware/auth', () => ({
  requireAdmin: (req: any, res: any, next: any) => next(),
}));

import uploadRoutes from '../routes/upload/image';

const app = express();
app.use(express.json());
app.use('/api/upload/image', uploadRoutes);

describe('POST /api/upload/image', () => {
  it('should return 400 if no file provided', async () => {
    const res = await request(app)
      .post('/api/upload/image');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 with url when file uploaded', async () => {
    const res = await request(app)
      .post('/api/upload/image')
      .attach('image', Buffer.from('fake image content'), 'test.jpg');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.url).toBe('https://res.cloudinary.com/test/image.jpg');
  });
});