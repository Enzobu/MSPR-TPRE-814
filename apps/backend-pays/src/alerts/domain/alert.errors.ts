// Erreurs métier des alertes. Pures (pas d'HttpException) : la couche interface
// les traduit en réponses RFC 7807 avec le bon status code.

export class AlertNotFoundError extends Error {
  constructor(id: string) {
    super(`Alert ${id} not found`);
    this.name = 'AlertNotFoundError';
  }
}
