import bcrypt from 'bcryptjs';

export async function hashPassword(clearTextPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(clearTextPassword, salt);
  return hash;
}

export async function comparePassword(clearTextPassword: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(clearTextPassword, hash);
}
