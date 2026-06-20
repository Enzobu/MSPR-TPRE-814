import { BcryptPasswordHasher } from './bcrypt-password-hasher';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();

  it('should produce a hash that differs from the plaintext', async () => {
    // Act
    const hash = await hasher.hash('Adm1n-FutureKawa');

    // Assert
    expect(hash).not.toBe('Adm1n-FutureKawa');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('should accept the matching password', async () => {
    // Arrange
    const hash = await hasher.hash('Adm1n-FutureKawa');

    // Act / Assert
    await expect(hasher.compare('Adm1n-FutureKawa', hash)).resolves.toBe(true);
  });

  it('should reject a wrong password', async () => {
    // Arrange
    const hash = await hasher.hash('Adm1n-FutureKawa');

    // Act / Assert
    await expect(hasher.compare('wrong-password', hash)).resolves.toBe(false);
  });
});
