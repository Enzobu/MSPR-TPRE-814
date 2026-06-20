import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import type { PasswordHasher } from '../domain/password-hasher';

// bcrypt cost 12 (ADR-0006). Adapter du port PasswordHasher.
const BCRYPT_COST = 12;

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return hash(plain, BCRYPT_COST);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
