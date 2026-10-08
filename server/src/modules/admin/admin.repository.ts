import { InMemoryUser, dbFindByEmail, dbUpsertUser } from '../shared/db/index.js';

export interface IAdminRepository {
  upsertUser(user: Partial<InMemoryUser> & { firebaseUid: string; email: string }, executor?: any): Promise<InMemoryUser> | InMemoryUser;
  findByEmail(email: string): Promise<InMemoryUser | undefined> | InMemoryUser | undefined;
}

export class AdminRepository implements IAdminRepository {
  public async upsertUser(user: Partial<InMemoryUser> & { firebaseUid: string; email: string }, executor?: any): Promise<InMemoryUser> {
    return dbUpsertUser(user, executor);
  }

  public async findByEmail(email: string): Promise<InMemoryUser | undefined> {
    return dbFindByEmail(email);
  }
}

export const adminRepository = new AdminRepository();
