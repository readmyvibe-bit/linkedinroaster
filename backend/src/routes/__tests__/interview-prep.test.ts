import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Route-level unit tests for interview-prep endpoints.
 * Tests route ordering, UUID validation, quota enforcement, and input validation.
 * These mock the DB layer and test Express handler logic.
 */

// Mock DB
vi.mock('../../db', () => ({ query: vi.fn() }));
vi.mock('../../services/interview-prep', () => ({
  generateInterviewPrep: vi.fn().mockReturnValue(Promise.resolve()),
}));
vi.mock('../../services/interview-prep-v2', () => ({
  generateInterviewPrepV2: vi.fn().mockReturnValue(Promise.resolve()),
}));
vi.mock('@google/generative-ai', () => {
  return { GoogleGenerativeAI: class { getGenerativeModel() { return {}; } } };
});

// Import after mocks
import { default as router } from '../interview-prep';
import { query } from '../../db';
import { generateInterviewPrepV2 } from '../../services/interview-prep-v2';

const mockQuery = vi.mocked(query);
const mockGenV2 = vi.mocked(generateInterviewPrepV2);

// Helper to find route handler
function findRoute(method: string, path: string) {
  const stack = (router as any).stack || [];
  for (const layer of stack) {
    if (layer.route) {
      const routePath = layer.route.path;
      const routeMethod = Object.keys(layer.route.methods)[0];
      if (routeMethod === method && routePath === path) {
        return layer.route.stack[0].handle;
      }
    }
  }
  return null;
}

// Mock Express req/res
function mockReq(overrides: any = {}) {
  return { params: {}, body: {}, query: {}, headers: {}, ...overrides };
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('interview-prep routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-set the mock return value after clearAllMocks
    mockGenV2.mockReturnValue(Promise.resolve());
  });

  // ─── Route Ordering ───

  describe('route ordering', () => {
    it('has /by-resume/:resumeId defined before /:id', () => {
      const stack = (router as any).stack || [];
      const routes = stack
        .filter((l: any) => l.route)
        .map((l: any) => ({ path: l.route.path, method: Object.keys(l.route.methods)[0] }));

      const byResumeIndex = routes.findIndex((r: any) => r.path === '/by-resume/:resumeId');
      const byIdIndex = routes.findIndex((r: any) => r.path === '/:id' && r.method === 'get');

      expect(byResumeIndex).toBeGreaterThan(-1);
      expect(byIdIndex).toBeGreaterThan(-1);
      expect(byResumeIndex).toBeLessThan(byIdIndex);
    });
  });

  // ─── UUID Validation ───

  describe('UUID validation', () => {
    it('GET /:id rejects non-UUID', async () => {
      const handler = findRoute('get', '/:id');
      const req = mockReq({ params: { id: 'not-a-uuid' } });
      const res = mockRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid prep ID format' });
    });

    it('GET /:id accepts valid UUID', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: '550e8400-e29b-41d4-a716-446655440000', status: 'ready' }] });
      const handler = findRoute('get', '/:id');
      const req = mockReq({ params: { id: '550e8400-e29b-41d4-a716-446655440000' } });
      const res = mockRes();
      await handler(req, res);
      expect(res.status).not.toHaveBeenCalledWith(400);
    });

    it('GET /by-resume/:resumeId rejects non-UUID', async () => {
      const handler = findRoute('get', '/by-resume/:resumeId');
      const req = mockReq({ params: { resumeId: 'abc123' } });
      const res = mockRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid resume ID format' });
    });

    it('POST / rejects non-UUID resume_id', async () => {
      const handler = findRoute('post', '/');
      const req = mockReq({ body: { resume_id: 'bad-id' } });
      const res = mockRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid resume_id format' });
    });

    it('POST / rejects missing resume_id', async () => {
      const handler = findRoute('post', '/');
      const req = mockReq({ body: {} });
      const res = mockRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing resume_id' });
    });
  });

  // ─── interview_level Validation ───

  describe('interview_level validation', () => {
    it('rejects invalid interview_level', async () => {
      const handler = findRoute('post', '/');
      const req = mockReq({ body: { resume_id: '550e8400-e29b-41d4-a716-446655440000', interview_level: 'executive' } });
      const res = mockRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Invalid interview_level') }));
    });

    it('accepts valid interview_level values', async () => {
      for (const level of ['entry', 'mid', 'senior', 'lead']) {
        const handler = findRoute('post', '/');
        // Resume exists
        mockQuery.mockResolvedValueOnce({ rows: [{ id: '550e8400-e29b-41d4-a716-446655440000', order_id: 'o1' }] });
        // No existing prep
        mockQuery.mockResolvedValueOnce({ rows: [] });
        // Prep count
        mockQuery.mockResolvedValueOnce({ rows: [{ cnt: 0 }] });
        // Order lookup
        mockQuery.mockResolvedValueOnce({ rows: [{ plan: 'pro' }] });
        // Insert
        mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-prep-id' }] });

        const req = mockReq({ body: { resume_id: '550e8400-e29b-41d4-a716-446655440000', interview_level: level } });
        const res = mockRes();
        await handler(req, res);
        expect(res.status).not.toHaveBeenCalledWith(400);
      }
    });
  });

  // ─── Quota Enforcement ───

  describe('quota enforcement', () => {
    it('blocks starter plan from creating preps', async () => {
      const handler = findRoute('post', '/');
      const resumeId = '550e8400-e29b-41d4-a716-446655440000';
      // Resume exists
      mockQuery.mockResolvedValueOnce({ rows: [{ id: resumeId, order_id: 'o1' }] });
      // No existing prep
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // 0 existing preps
      mockQuery.mockResolvedValueOnce({ rows: [{ cnt: 0 }] });
      // Order is starter plan
      mockQuery.mockResolvedValueOnce({ rows: [{ plan: 'starter' }] });

      const req = mockReq({ body: { resume_id: resumeId } });
      const res = mockRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Starter plan') }));
    });

    it('blocks standard plan after 1 prep per resume', async () => {
      const handler = findRoute('post', '/');
      const resumeId = '550e8400-e29b-41d4-a716-446655440000';
      mockQuery.mockResolvedValueOnce({ rows: [{ id: resumeId, order_id: 'o1' }] });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // no ready/processing/queued
      mockQuery.mockResolvedValueOnce({ rows: [{ cnt: 1 }] }); // 1 existing non-failed
      mockQuery.mockResolvedValueOnce({ rows: [{ plan: 'standard' }] });

      const req = mockReq({ body: { resume_id: resumeId } });
      const res = mockRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('limit reached'),
        limit: 1,
        used: 1,
      }));
    });

    it('allows pro plan up to 3 preps', async () => {
      const handler = findRoute('post', '/');
      const resumeId = '550e8400-e29b-41d4-a716-446655440000';
      mockQuery.mockResolvedValueOnce({ rows: [{ id: resumeId, order_id: 'o1' }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ cnt: 2 }] }); // 2 used, quota is 3
      mockQuery.mockResolvedValueOnce({ rows: [{ plan: 'pro' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-prep' }] });

      const req = mockReq({ body: { resume_id: resumeId } });
      const res = mockRes();
      await handler(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'new-prep', status: 'queued' }));
    });
  });

  // ─── Existing Prep Handling ───

  describe('existing prep handling', () => {
    it('returns existing prep if status is ready', async () => {
      const handler = findRoute('post', '/');
      const resumeId = '550e8400-e29b-41d4-a716-446655440000';
      mockQuery.mockResolvedValueOnce({ rows: [{ id: resumeId, order_id: 'o1' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-prep', status: 'ready' }] });

      const req = mockReq({ body: { resume_id: resumeId } });
      const res = mockRes();
      await handler(req, res);
      expect(res.json).toHaveBeenCalledWith({ id: 'existing-prep', status: 'ready' });
    });

    it('returns existing prep if status is processing', async () => {
      const handler = findRoute('post', '/');
      const resumeId = '550e8400-e29b-41d4-a716-446655440000';
      mockQuery.mockResolvedValueOnce({ rows: [{ id: resumeId, order_id: 'o1' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-prep', status: 'processing' }] });

      const req = mockReq({ body: { resume_id: resumeId } });
      const res = mockRes();
      await handler(req, res);
      expect(res.json).toHaveBeenCalledWith({ id: 'existing-prep', status: 'processing' });
    });

    it('allows new prep if last one failed', async () => {
      const handler = findRoute('post', '/');
      const resumeId = '550e8400-e29b-41d4-a716-446655440000';
      mockQuery.mockResolvedValueOnce({ rows: [{ id: resumeId, order_id: 'o1' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'failed-prep', status: 'failed' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ cnt: 0 }] }); // failed doesn't count
      mockQuery.mockResolvedValueOnce({ rows: [{ plan: 'standard' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-prep' }] });

      const req = mockReq({ body: { resume_id: resumeId } });
      const res = mockRes();
      await handler(req, res);
      expect(res.json).toHaveBeenCalledWith({ id: 'new-prep', status: 'queued' });
    });
  });

  // ─── 404 Handling ───

  describe('not found', () => {
    it('GET /:id returns 404 for non-existent prep', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const handler = findRoute('get', '/:id');
      const req = mockReq({ params: { id: '550e8400-e29b-41d4-a716-446655440000' } });
      const res = mockRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('POST / returns 404 for non-existent resume', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const handler = findRoute('post', '/');
      const req = mockReq({ body: { resume_id: '550e8400-e29b-41d4-a716-446655440000' } });
      const res = mockRes();
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
