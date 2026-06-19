import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';

// Le PrismaClient généré valide l'adapter et ouvrirait une vraie connexion : on
// neutralise la classe de base pour tester uniquement la logique de PrismaService.
const disconnectMock = jest.fn().mockResolvedValue(undefined);
jest.mock('../../generated/prisma/client', () => ({
  PrismaClient: class {
    $disconnect = disconnectMock;
  },
}));

// L'adapter MariaDB ouvrirait une connexion réseau : on le neutralise aussi.
jest.mock('@prisma/adapter-mariadb', () => ({
  PrismaMariaDb: jest.fn().mockImplementation(() => ({ provider: 'mysql' })),
}));

import { PrismaService } from './prisma.service';

function buildConfig(url: string): {
  config: ConfigService<Env, true>;
  get: jest.Mock;
} {
  const get = jest.fn().mockReturnValue(url);
  const config = { get } as unknown as ConfigService<Env, true>;
  return { config, get };
}

describe('PrismaService', () => {
  it('should build the MariaDB adapter from DATABASE_URL', () => {
    // Arrange
    const { config, get } = buildConfig('mysql://user:pass@localhost:3306/db');

    // Act
    const service = new PrismaService(config);

    // Assert
    expect(service).toBeInstanceOf(PrismaService);
    expect(get).toHaveBeenCalledWith('DATABASE_URL');
  });

  it('should disconnect Prisma on module destroy', async () => {
    // Arrange
    disconnectMock.mockClear();
    const { config } = buildConfig('mysql://user:pass@localhost:3306/db');
    const service = new PrismaService(config);

    // Act
    await service.onModuleDestroy();

    // Assert
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });
});
