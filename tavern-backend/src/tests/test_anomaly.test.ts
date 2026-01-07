// src/tests/test_anomaly.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import app from '../app';
import { UserModel } from '../models/user.model';
import { AnomalyModel } from '../models/anomaly.model';
import { Quest } from '../models/quest.model';
import { signJwt } from '../config/jwt.config';
import { Types } from 'mongoose';

describe('Anomaly API Endpoints', () => {
  let guildMasterToken: string;
  let adventurerToken: string;
  let npcToken: string;
  let guildMasterId: string;
  let adventurerId: string;
  let npcId: string;

  // Helper function to create a user and return token
  const createUserAndToken = async (role: 'ADVENTURER' | 'NPC' | 'GUILD_MASTER') => {
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const timestamp = Date.now();
    
    const user = await UserModel.create({
      email: `${role.toLowerCase()}${timestamp}@test.com`,
      username: `test${role}${timestamp}`, // Add timestamp to ensure uniqueness
      displayName: `Test ${role}`,
      password: hashedPassword,
      role: role,
    });

    const token = signJwt({
      sub: String(user._id),
      role: role,
    });

    return { user, token };
  };

  beforeAll(async () => {
    // Create test users
    const gm = await createUserAndToken('GUILD_MASTER');
    guildMasterToken = gm.token;
    guildMasterId = String(gm.user._id);

    const adv = await createUserAndToken('ADVENTURER');
    adventurerToken = adv.token;
    adventurerId = String(adv.user._id);

    const npc = await createUserAndToken('NPC');
    npcToken = npc.token;
    npcId = String(npc.user._id);
  });

  describe('POST /api/admin/anomalies/scan', () => {
    it('should scan for anomalies and return results (Guild Master only)', async () => {
      // Create an inactive NPC (no quests in last week)
      const inactiveNPC = await UserModel.create({
        email: 'inactive@test.com',
        username: 'inactivenpc',
        displayName: 'Inactive NPC',
        password: 'hashed',
        role: 'NPC',
      });

      const response = await request(app)
        .post('/api/admin/anomalies/scan')
        .set('Authorization', `Bearer ${guildMasterToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      // Should detect inactive NPC
      const inactiveAnomaly = response.body.data.find(
        (a: any) => a.type === 'NPC_INACTIVE'
      );
      expect(inactiveAnomaly).toBeDefined();
    });

    it('should detect overworked adventurers', async () => {
      // Create an adventurer with many active quests
      const overworkedAdv = await UserModel.create({
        email: 'overworked@test.com',
        username: 'overworked',
        displayName: 'Overworked Adventurer',
        password: 'hashed',
        role: 'ADVENTURER',
      });

      // Create 6 active quests for this adventurer
      for (let i = 0; i < 6; i++) {
        await Quest.create({
          title: `Quest ${i}`,
          description: 'Test quest',
          difficulty: 'Easy',
          status: 'Accepted',
          npcId: new Types.ObjectId(npcId),
          adventurerId: overworkedAdv._id,
        });
      }

      const response = await request(app)
        .post('/api/admin/anomalies/scan')
        .set('Authorization', `Bearer ${guildMasterToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      const overworkedAnomaly = response.body.data.find(
        (a: any) => a.type === 'ADVENTURER_OVERWORKED'
      );
      expect(overworkedAnomaly).toBeDefined();
      expect(overworkedAnomaly.severity).toBe('HIGH');
    });

    it('should detect deadline anomalies', async () => {
      // Create a quest with passed deadline
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      await Quest.create({
        title: 'Overdue Quest',
        description: 'This quest is overdue',
        difficulty: 'Medium',
        status: 'Accepted',
        deadline: pastDate,
        npcId: new Types.ObjectId(npcId),
        adventurerId: new Types.ObjectId(adventurerId),
      });

      const response = await request(app)
        .post('/api/admin/anomalies/scan')
        .set('Authorization', `Bearer ${guildMasterToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      const deadlineAnomaly = response.body.data.find(
        (a: any) => a.type === 'QUEST_DEADLINE_PASSED'
      );
      expect(deadlineAnomaly).toBeDefined();
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .post('/api/admin/anomalies/scan')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests from non-Guild Master users', async () => {
      const response = await request(app)
        .post('/api/admin/anomalies/scan')
        .set('Authorization', `Bearer ${adventurerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/anomalies', () => {
    beforeEach(async () => {
      // Create some test anomalies
      await AnomalyModel.create({
        subjectUserId: new Types.ObjectId(adventurerId),
        subjectRole: 'ADVENTURER',
        type: 'TEST_ANOMALY',
        severity: 'MEDIUM',
        summary: 'Test anomaly 1',
        status: 'OPEN',
      });

      await AnomalyModel.create({
        subjectUserId: new Types.ObjectId(npcId),
        subjectRole: 'NPC',
        type: 'TEST_ANOMALY',
        severity: 'HIGH',
        summary: 'Test anomaly 2',
        status: 'ACKNOWLEDGED',
      });
    });

    it('should list all anomalies (Guild Master only)', async () => {
      const response = await request(app)
        .get('/api/admin/anomalies')
        .set('Authorization', `Bearer ${guildMasterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      
      // Check structure of anomaly objects
      const anomaly = response.body.data[0];
      expect(anomaly).toHaveProperty('_id');
      expect(anomaly).toHaveProperty('type');
      expect(anomaly).toHaveProperty('severity');
      expect(anomaly).toHaveProperty('summary');
      expect(anomaly).toHaveProperty('status');
    });

    it('should return anomalies sorted by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/admin/anomalies')
        .set('Authorization', `Bearer ${guildMasterToken}`)
        .expect(200);

      const anomalies = response.body.data;
      if (anomalies.length > 1) {
        const firstDate = new Date(anomalies[0].createdAt).getTime();
        const secondDate = new Date(anomalies[1].createdAt).getTime();
        expect(firstDate).toBeGreaterThanOrEqual(secondDate);
      }
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/anomalies')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests from non-Guild Master users', async () => {
      const response = await request(app)
        .get('/api/admin/anomalies')
        .set('Authorization', `Bearer ${npcToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/admin/anomalies/:id/status', () => {
    let anomalyId: string;

    beforeEach(async () => {
      // Create a test anomaly
      const anomaly = await AnomalyModel.create({
        subjectUserId: new Types.ObjectId(adventurerId),
        subjectRole: 'ADVENTURER',
        type: 'TEST_ANOMALY',
        severity: 'MEDIUM',
        summary: 'Test anomaly for status update',
        status: 'OPEN',
      });
      anomalyId = String(anomaly._id);
    });

    it('should update anomaly status to ACKNOWLEDGED', async () => {
      const response = await request(app)
        .patch(`/api/admin/anomalies/${anomalyId}/status`)
        .set('Authorization', `Bearer ${guildMasterToken}`)
        .send({ status: 'ACKNOWLEDGED' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ACKNOWLEDGED');
    });

    it('should update anomaly status to RESOLVED', async () => {
      const response = await request(app)
        .patch(`/api/admin/anomalies/${anomalyId}/status`)
        .set('Authorization', `Bearer ${guildMasterToken}`)
        .send({ status: 'RESOLVED' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('RESOLVED');
    });

    it('should update anomaly status to IGNORED', async () => {
      const response = await request(app)
        .patch(`/api/admin/anomalies/${anomalyId}/status`)
        .set('Authorization', `Bearer ${guildMasterToken}`)
        .send({ status: 'IGNORED' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('IGNORED');
    });

    it('should return 400 if status is not provided', async () => {
      const response = await request(app)
        .patch(`/api/admin/anomalies/${anomalyId}/status`)
        .set('Authorization', `Bearer ${guildMasterToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Status is required');
    });

    it('should return 404 if anomaly does not exist', async () => {
      const fakeId = new Types.ObjectId();
      const response = await request(app)
        .patch(`/api/admin/anomalies/${fakeId}/status`)
        .set('Authorization', `Bearer ${guildMasterToken}`)
        .send({ status: 'RESOLVED' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .patch(`/api/admin/anomalies/${anomalyId}/status`)
        .send({ status: 'RESOLVED' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests from non-Guild Master users', async () => {
      const response = await request(app)
        .patch(`/api/admin/anomalies/${anomalyId}/status`)
        .set('Authorization', `Bearer ${adventurerToken}`)
        .send({ status: 'RESOLVED' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Integration: Full anomaly workflow', () => {
    it('should scan, list, and update anomalies in sequence', async () => {
      // Step 1: Scan for anomalies
      const scanResponse = await request(app)
        .post('/api/admin/anomalies/scan')
        .set('Authorization', `Bearer ${guildMasterToken}`)
        .expect(201);

      expect(scanResponse.body.success).toBe(true);

      // Step 2: List anomalies
      const listResponse = await request(app)
        .get('/api/admin/anomalies')
        .set('Authorization', `Bearer ${guildMasterToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      const anomalies = listResponse.body.data;
      
      if (anomalies.length > 0) {
        // Step 3: Update first anomaly status
        const firstAnomaly = anomalies[0];
        const updateResponse = await request(app)
          .patch(`/api/admin/anomalies/${firstAnomaly._id}/status`)
          .set('Authorization', `Bearer ${guildMasterToken}`)
          .send({ status: 'ACKNOWLEDGED' })
          .expect(200);

        expect(updateResponse.body.success).toBe(true);
        expect(updateResponse.body.data.status).toBe('ACKNOWLEDGED');
      }
    });
  });
});

