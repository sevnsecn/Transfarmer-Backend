import request from 'supertest';
import express from 'express';

jest.mock('../lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
}));

jest.mock('../services/productService', () => ({
  getAllProducts: jest.fn(),
  getProductById: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
}));

import productRoutes from '../routes/products';
import { getAllProducts, getProductById } from '../services/productService';

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

describe('GET /api/products', () => {
  it('should return all products', async () => {
    (getAllProducts as jest.Mock).mockResolvedValue([
      { _id: '1', product_name: 'Tomato', price_per_kg: 5000, stock_kg: 100 },
    ]);

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
  });

  it('should support search filter', async () => {
    (getAllProducts as jest.Mock).mockResolvedValue([
      { _id: '1', product_name: 'Tomato', price_per_kg: 5000, stock_kg: 100 },
    ]);

    const res = await request(app).get('/api/products?search=Tomato');
    expect(res.status).toBe(200);
    expect(res.body.data[0].product_name).toBe('Tomato');
  });
});

describe('GET /api/products/:id', () => {
  it('should return 404 if product not found', async () => {
    (getProductById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/products/badid');
    expect(res.status).toBe(404);
  });

  it('should return product if found', async () => {
    (getProductById as jest.Mock).mockResolvedValue({
      _id: '1',
      product_name: 'Tomato',
      price_per_kg: 5000,
      stock_kg: 100,
    });

    const res = await request(app).get('/api/products/1');
    expect(res.status).toBe(200);
    expect(res.body.data.product_name).toBe('Tomato');
  });
});

describe('POST /api/products', () => {
  it('should return 401 without token', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ product_name: 'Carrot', price_per_kg: 3000, stock_kg: 50 });
    expect(res.status).toBe(401);
  });
});