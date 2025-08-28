import { CourseService } from '../services/course';
import { CommunityService } from '../services/community';
import { EnrollmentService } from '../services/enrollment';
import { UserScoreService, AchievementService } from '../services/scoreboard';
import { CommunityMemberService } from '../services/community';

// Mock the database
jest.mock('../db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: '1' }]),
    $dynamic: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  },
  courses: {},
  communities: {},
  enrollments: {},
  userScores: {},
  achievements: {},
  communityMembers: {},
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
  asc: jest.fn(),
  count: jest.fn(),
}));

describe('Pagination with Count', () => {
  describe('CourseService', () => {
    it('should return courses with totalCount', async () => {
      const result = await CourseService.getAllCourses(1, 10);
      expect(result).toHaveProperty('courses');
      expect(result).toHaveProperty('totalCount');
    });
  });

  describe('CommunityService', () => {
    it('should return communities with totalCount', async () => {
      const result = await CommunityService.getAllCommunities(1, 10);
      expect(result).toHaveProperty('communities');
      expect(result).toHaveProperty('totalCount');
    });
  });

  describe('EnrollmentService', () => {
    it('should return enrollments with totalCount', async () => {
      const result = await EnrollmentService.getUserEnrollments('user1', 1, 10);
      expect(result).toHaveProperty('enrollments');
      expect(result).toHaveProperty('totalCount');
    });
  });

  describe('UserScoreService', () => {
    it('should return leaderboard with totalCount', async () => {
      const result = await UserScoreService.getCommunityLeaderboard('community1', 1, 10);
      expect(result).toHaveProperty('leaderboard');
      expect(result).toHaveProperty('totalCount');
    });
  });

  describe('AchievementService', () => {
    it('should return achievements with totalCount', async () => {
      const result = await AchievementService.getAllAchievements(1, 10);
      expect(result).toHaveProperty('achievements');
      expect(result).toHaveProperty('totalCount');
    });
  });

  describe('CommunityMemberService', () => {
    it('should return members with totalCount', async () => {
      const result = await CommunityMemberService.getCommunityMembers('community1', 1, 10);
      expect(result).toHaveProperty('members');
      expect(result).toHaveProperty('totalCount');
    });
  });
});