import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import type { UserAccount } from '../domain/user-account';
import type { UserRepository } from '../domain/user.repository';

// Adapter Prisma du port UserRepository (DB siège). Mappe la ligne Prisma vers
// l'entité domaine — jamais d'entité Prisma au-delà de cette frontière.
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserAccount | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async findById(id: string): Promise<UserAccount | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: {
    id: string;
    email: string;
    passwordHash: string;
    role: UserAccount['role'];
    country: string | null;
  }): UserAccount {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      country: row.country,
    };
  }
}
