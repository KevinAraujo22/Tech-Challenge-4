// Remove o hash da senha de qualquer documento serializado em JSON,
// para que ele nunca saia da API.
export const hidePasswordHash = (_doc: unknown, ret: Record<string, unknown>) => {
  delete ret.passwordHash;
  delete ret.__v;
  return ret;
};
