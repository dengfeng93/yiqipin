import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SensitiveWordService } from '../common/services/sensitive-word.service';

@Injectable()
export class AdminService {
  constructor(
    private jwtService: JwtService,
    @InjectDataSource() private db: DataSource,
    private sensitiveWord: SensitiveWordService,
  ) {}

  async login(username: string, password: string) {
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'yiqipin2026';
    if (username !== adminUser || password !== adminPass) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const token = this.jwtService.sign({ sub: 'admin', role: 'admin' });
    return { token, user: { username: adminUser, role: 'admin' } };
  }

  async getStats() {
    const [userResult] = await this.db.query(`SELECT count(*)::int AS cnt FROM users WHERE deleted_at IS NULL`);
    const [circleResult] = await this.db.query(`SELECT count(*)::int AS cnt FROM circles WHERE status IN ('active','preparing')`);
    const [todayCircleResult] = await this.db.query(`SELECT count(*)::int AS cnt FROM circles WHERE created_at::date = CURRENT_DATE`);
    const [completionResult] = await this.db.query(
      `SELECT CASE WHEN total = 0 THEN 0 ELSE round(completed::decimal / total * 100, 1) END AS rate
       FROM (SELECT count(*) AS total FROM circles WHERE status != 'preparing') t,
            (SELECT count(*) AS completed FROM circles WHERE status IN ('archived', 'private_permanent')) c`
    );
    const [pendingReportResult] = await this.db.query(`SELECT count(*)::int AS cnt FROM reports WHERE status = 'pending'`);

    return {
      users: parseInt(userResult?.cnt || 0),
      circles: parseInt(todayCircleResult?.cnt || 0),
      completion: parseFloat(completionResult?.rate || 0),
      reports: parseInt(pendingReportResult?.cnt || 0),
    };
  }

  async getUsers(page = 1, limit = 20, keyword?: string) {
    const offset = (page - 1) * limit;
    let where = 'WHERE u.deleted_at IS NULL';
    const params: any[] = [];
    if (keyword) {
      where += ` AND (u.nickname ILIKE $${params.length + 1} OR u.phone ILIKE $${params.length + 1})`;
      params.push(`%${keyword}%`);
    }
    const [data] = await this.db.query(
      `SELECT u.id, u.nickname, u.phone, u.role, u.created_at,
              up.showup_rate, up.total_joined, up.recent_pigeon_count
       FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id
       ${where} ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    const [countResult] = await this.db.query(`SELECT count(*)::int AS cnt FROM users u ${where}`, params);
    return { data, total: parseInt(countResult?.cnt || 0), page, limit };
  }

  async toggleUserBan(userId: string) {
    await this.db.query(`UPDATE users SET deleted_at = CASE WHEN deleted_at IS NULL THEN NOW() ELSE NULL END WHERE id = $1`, [userId]);
    return { ok: true };
  }

  async getCircles(page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit;
    let where = '';
    const params: any[] = [];
    if (status) {
      where = `WHERE c.status = $1`;
      params.push(status);
    }
    const [data] = await this.db.query(
      `SELECT c.*, u.nickname AS creator_name, cat.name AS category_name,
              (SELECT count(*) FROM circle_members cm WHERE cm.circle_id = c.id) AS member_count
       FROM circles c
       LEFT JOIN users u ON c.creator_id = u.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       ${where} ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    const [countResult] = await this.db.query(`SELECT count(*)::int AS cnt FROM circles c ${where}`, params);
    return { data, total: parseInt(countResult?.cnt || 0), page, limit };
  }

  async forceDissolveCircle(circleId: string) {
    await this.db.query(`UPDATE circles SET status = 'dissolved', dissolved_at = NOW() WHERE id = $1`, [circleId]);
    return { ok: true };
  }

  async getReports(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [data] = await this.db.query(
      `SELECT r.*, reporter.nickname AS reporter_name, target.nickname AS target_name
       FROM reports r
       LEFT JOIN users reporter ON r.reporter_id = reporter.id
       LEFT JOIN users target ON r.target_user_id = target.id
       ORDER BY r.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const [countResult] = await this.db.query(`SELECT count(*)::int AS cnt FROM reports`);
    return { data, total: parseInt(countResult?.cnt || 0), page, limit };
  }

  async handleReport(reportId: string, action: 'dismiss' | 'confirm') {
    if (action === 'confirm') {
      const [report] = await this.db.query(`SELECT target_user_id FROM reports WHERE id = $1`, [reportId]);
      if (report) {
        await this.db.query(
          `INSERT INTO violation_records (user_id, action, reason) VALUES ($1, 'ban', 'report_confirmed')`,
          [report.target_user_id],
        );
        await this.db.query(`UPDATE users SET deleted_at = NOW() WHERE id = $1`, [report.target_user_id]);
      }
    }
    await this.db.query(`UPDATE reports SET status = $1, handled_by = 'admin' WHERE id = $2`,
      [action === 'dismiss' ? 'dismissed' : 'reviewed', reportId]);
    return { ok: true };
  }

  async getSensitiveWords(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const [data] = await this.db.query(
      `SELECT * FROM sensitive_words ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const [countResult] = await this.db.query(`SELECT count(*)::int AS cnt FROM sensitive_words`);
    return { data, total: parseInt(countResult?.cnt || 0), page, limit };
  }

  async addSensitiveWord(word: string, level: number) {
    await this.sensitiveWord.add(word, level, 'admin');
    return { ok: true };
  }

  async deleteSensitiveWord(wordId: string) {
    await this.db.query(`DELETE FROM sensitive_words WHERE id = $1`, [wordId]);
    await this.sensitiveWord.reload();
    return { ok: true };
  }

  async updateWishThreshold(categoryId: string, threshold: number) {
    await this.db.query(`UPDATE categories SET wish_threshold = $1 WHERE id = $2`, [threshold, categoryId]);
    return { ok: true };
  }
}
