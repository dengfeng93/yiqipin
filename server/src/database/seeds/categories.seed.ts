import { DataSource } from 'typeorm';
import { Category } from '../../category/entities/category.entity';

const CATEGORIES = [
  { name: '篮球', icon: '🏀', sort: 1, default_max_members: 10, wish_threshold: 6 },
  { name: '足球', icon: '⚽', sort: 2, default_max_members: 10, wish_threshold: 6 },
  { name: '羽毛球', icon: '🏸', sort: 3, default_max_members: 4, wish_threshold: 4 },
  { name: '网球', icon: '🎾', sort: 4, default_max_members: 4, wish_threshold: 4 },
  { name: '乒乓球', icon: '🏓', sort: 5, default_max_members: 4, wish_threshold: 4 },
  { name: '跑步', icon: '🏃', sort: 6, default_max_members: 6, wish_threshold: 2 },
  { name: '骑行', icon: '🚴', sort: 7, default_max_members: 6, wish_threshold: 2 },
  { name: '徒步', icon: '🥾', sort: 8, default_max_members: 6, wish_threshold: 2 },
  { name: '游泳', icon: '🏊', sort: 9, default_max_members: 4, wish_threshold: 2 },
  { name: '健身打卡', icon: '💪', sort: 10, default_max_members: 4, wish_threshold: 2 },
  { name: '拼奶茶', icon: '🧋', sort: 11, default_max_members: 6, wish_threshold: 3 },
  { name: '拼外卖', icon: '🍱', sort: 12, default_max_members: 6, wish_threshold: 3 },
  { name: '拼车', icon: '🚗', sort: 13, default_max_members: 6, wish_threshold: 3 },
  { name: 'K歌', icon: '🎤', sort: 14, default_max_members: 8, wish_threshold: 3 },
  { name: '剧本杀', icon: '🎭', sort: 15, default_max_members: 8, wish_threshold: 3 },
  { name: '桌游', icon: '🎲', sort: 16, default_max_members: 8, wish_threshold: 3 },
];

export async function seedCategories(dataSource: DataSource) {
  const repo = dataSource.getRepository(Category);
  for (const cat of CATEGORIES) {
    const existing = await repo.findOne({ where: { name: cat.name } });
    if (!existing) {
      await repo.save(repo.create(cat));
    }
  }
}
