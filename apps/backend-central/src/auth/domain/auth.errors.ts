// Erreurs métier d'authentification. Pures (pas d'HttpException ici) : la couche
// interface les traduit en réponses RFC 7807 (401), sans fuite d'information.

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Invalid or expired refresh token');
    this.name = 'InvalidRefreshTokenError';
  }
}
