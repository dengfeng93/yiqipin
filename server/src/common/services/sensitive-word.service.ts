import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensitiveWord } from '../entities/sensitive-word.entity';

@Injectable()
export class SensitiveWordService implements OnModuleInit {
  private words: { word: string; level: number }[] = [];

  constructor(
    @InjectRepository(SensitiveWord) private wordRepo: Repository<SensitiveWord>,
  ) {}

  async onModuleInit() {
    await this.reload();
  }

  async reload() {
    this.words = await this.wordRepo.find();
  }

  check(text: string): { passed: boolean; hit_word?: string } {
    if (!text) return { passed: true };
    const lower = text.toLowerCase();
    for (const w of this.words) {
      if (lower.includes(w.word.toLowerCase())) {
        return { passed: w.level !== 1, hit_word: w.word };
      }
    }
    return { passed: true };
  }

  mask(text: string): string {
    if (!text) return text;
    let result = text;
    for (const w of this.words) {
      const escaped = w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'gi'), '***');
    }
    return result;
  }

  async add(word: string, level: number = 1, createdBy?: string) {
    await this.wordRepo.save({ word, level, created_by: createdBy });
    await this.reload();
  }

  async remove(word: string) {
    await this.wordRepo.delete({ word });
    await this.reload();
  }
}
