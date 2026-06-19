import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import { PrismaUserRepository } from './prisma-user.repository';

interface UserDelegateMock {
  findUnique: jest.Mock;
}

const buildPrisma = (delegate: UserDelegateMock): PrismaService =>
  ({ user: delegate }) as unknown as PrismaService;

const buildRow = () => ({
  id: 'u1',
  email: 'admin@futurekawa.local',
  passwordHash: 'stored-hash',
  role: 'ADMIN' as const,
  country: null,
});

describe('PrismaUserRepository', () => {
  let delegate: UserDelegateMock;
  let repository: PrismaUserRepository;

  beforeEach(() => {
    delegate = { findUnique: jest.fn() };
    repository = new PrismaUserRepository(buildPrisma(delegate));
  });

  describe('findByEmail', () => {
    it('should map the prisma row to a domain user account', async () => {
      // Arrange
      delegate.findUnique.mockResolvedValue(buildRow());

      // Act
      const result = await repository.findByEmail('admin@futurekawa.local');

      // Assert
      expect(delegate.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@futurekawa.local' },
      });
      expect(result).toEqual({
        id: 'u1',
        email: 'admin@futurekawa.local',
        passwordHash: 'stored-hash',
        role: 'ADMIN',
        country: null,
      });
    });

    it('should return null when no user matches the email', async () => {
      // Arrange
      delegate.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findByEmail('ghost@futurekawa.local');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should map the prisma row to a domain user account, keeping the country', async () => {
      // Arrange
      delegate.findUnique.mockResolvedValue({ ...buildRow(), country: 'BR' });

      // Act
      const result = await repository.findById('u1');

      // Assert
      expect(delegate.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
      expect(result).toEqual({
        id: 'u1',
        email: 'admin@futurekawa.local',
        passwordHash: 'stored-hash',
        role: 'ADMIN',
        country: 'BR',
      });
    });

    it('should return null when no user matches the id', async () => {
      // Arrange
      delegate.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findById('missing');

      // Assert
      expect(result).toBeNull();
    });
  });
});
