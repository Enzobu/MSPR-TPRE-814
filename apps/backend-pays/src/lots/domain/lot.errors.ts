// Erreurs métier des lots. Pures (pas d'HttpException) : la couche interface les
// traduit en réponses RFC 7807 avec le bon status code.

export class LotNotFoundError extends Error {
  constructor(id: string) {
    super(`Lot ${id} not found`);
    this.name = 'LotNotFoundError';
  }
}

export class LotAlreadyExistsError extends Error {
  constructor(id: string) {
    super(`Lot ${id} already exists`);
    this.name = 'LotAlreadyExistsError';
  }
}

export class LotCountryMismatchError extends Error {
  constructor(expected: string, received: string) {
    super(
      `Lot country ${received} does not match this backend country ${expected}`,
    );
    this.name = 'LotCountryMismatchError';
  }
}
