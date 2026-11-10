import express from 'express';
import { AddressInfo } from 'net';
import { db } from '../db';
import coursesRouter from '../routes/courses';

// The course the mocked DB returns for getCourseById; null = not found.
let mockCourse: any = null;
// The authenticated user the mocked auth middleware attaches to req.user.
let mockUser: any = { id: 'instructor-1' };

// Mock the database: getCourseById's select/from/where/limit chain resolves
// to [mockCourse] (or [] when the course does not exist), and the
// insert/update/delete chains resolve their .returning() the same way.
jest.mock('../db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn(() => Promise.resolve(mockCourse ? [mockCourse] : [])),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    returning: jest.fn(() => Promise.resolve(mockCourse ? [mockCourse] : [])),
    orderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    $dynamic: jest.fn().mockReturnThis(),
  },
}));

// Mock auth: authenticate just attaches mockUser, so tests control who calls.
jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = mockUser;
    next();
  },
  optionalAuth: (_req: any, _res: any, next: any) => next(),
}));

const OWNER_COURSE = {
  id: 'course-1',
  instructorId: 'instructor-1',
  title: 'Intro to Testing',
};

describe('Course instructor ownership', () => {
  let server: any;
  let baseUrl: string;

  beforeAll((done) => {
    const app = express();
    app.use(express.json());
    app.use('/courses', coursesRouter);
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCourse = { ...OWNER_COURSE };
    mockUser = { id: 'instructor-1' };
  });

  describe('PUT /courses/:id', () => {
    it('rejects a non-instructor with 403 and never touches the course', async () => {
      mockUser = { id: 'someone-else' };

      const res = await fetch(`${baseUrl}/courses/course-1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Hijacked' }),
      });

      expect(res.status).toBe(403);
      expect(db.update).not.toHaveBeenCalled();
    });

    it('returns 404 when the course does not exist', async () => {
      mockCourse = null;

      const res = await fetch(`${baseUrl}/courses/missing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nope' }),
      });

      expect(res.status).toBe(404);
      expect(db.update).not.toHaveBeenCalled();
    });

    it('lets the instructor update, but strips instructorId from the update', async () => {
      const res = await fetch(`${baseUrl}/courses/course-1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New title', instructorId: 'someone-else' }),
      });

      expect(res.status).toBe(200);
      expect(db.update).toHaveBeenCalled();
      const setArg = ((db as any).set as jest.Mock).mock.calls[0][0];
      expect(setArg).toHaveProperty('title', 'New title');
      expect(setArg).not.toHaveProperty('instructorId');
    });
  });

  describe('DELETE /courses/:id', () => {
    it('rejects a non-instructor with 403 and never deletes the course', async () => {
      mockUser = { id: 'someone-else' };

      const res = await fetch(`${baseUrl}/courses/course-1`, { method: 'DELETE' });

      expect(res.status).toBe(403);
      expect(db.delete).not.toHaveBeenCalled();
    });

    it('returns 404 when the course does not exist', async () => {
      mockCourse = null;

      const res = await fetch(`${baseUrl}/courses/missing`, { method: 'DELETE' });

      expect(res.status).toBe(404);
      expect(db.delete).not.toHaveBeenCalled();
    });

    it('lets the instructor delete', async () => {
      const res = await fetch(`${baseUrl}/courses/course-1`, { method: 'DELETE' });

      expect(res.status).toBe(200);
      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe('POST /courses/:courseId/modules', () => {
    it('rejects a non-instructor with 403 and never creates the module', async () => {
      mockUser = { id: 'someone-else' };

      const res = await fetch(`${baseUrl}/courses/course-1/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Module 1', order: 1 }),
      });

      expect(res.status).toBe(403);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('returns 404 when the course does not exist', async () => {
      mockCourse = null;

      const res = await fetch(`${baseUrl}/courses/missing/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Module 1', order: 1 }),
      });

      expect(res.status).toBe(404);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('lets the instructor create a module', async () => {
      const res = await fetch(`${baseUrl}/courses/course-1/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Module 1', order: 1 }),
      });

      expect(res.status).toBe(201);
      expect(db.insert).toHaveBeenCalled();
    });
  });
});
