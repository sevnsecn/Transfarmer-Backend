import request from 'supertest';
import express from 'express';

jest.mock('../lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
}));

jest.mock('../services/orderService', () => ({
  getAllOrders: jest.fn(),
  getOrderById: jest.fn(),
  createOrder: jest.fn(),
  updateOrder: jest.fn(),
  deleteOrder: jest.fn(),
  checkoutOrder: jest.fn(),
  getOrdersByUser: jest.fn(),
  completeOrder: jest.fn(),
  autoCompleteOrders: jest.fn(),
}));

import orderRoutes from '../routes/orders';
import { getAllOrders, getOrderById } from '../services/orderService';

const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

describe('GET /api/orders', () => {
  it('should return all orders', async () => {
    (getAllOrders as jest.Mock).mockResolvedValue([
      { _id: '1', user_id: 'user1', status: 'pending', total_price: 50000 },
    ]);

    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/orders/:id', () => {
  it('should return 404 if order not found', async () => {
    (getOrderById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/orders/badid');
    expect(res.status).toBe(404);
  });

  it('should return order if found', async () => {
    (getOrderById as jest.Mock).mockResolvedValue({
      _id: '1',
      user_id: 'user1',
      status: 'pending',
      total_price: 50000,
    });

    const res = await request(app).get('/api/orders/1');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pending');
  });
});

describe('POST /api/orders', () => {
  it('should return 400 if user_id missing', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ total_price: 50000 });
    expect(res.status).toBe(400);
  });

  it('should return 401 for my-orders without token', async () => {
    const res = await request(app).get('/api/orders/my-orders');
    expect(res.status).toBe(401);
  });
});