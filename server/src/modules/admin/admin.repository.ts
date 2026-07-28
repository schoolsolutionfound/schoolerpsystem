import { InMemoryUser, dbFindByEmail, dbUpsertUser } from '../shared/db/index.js';

export interface IAdminRepository {
  upsertUser(user: Partial<InMemoryUser> & { firebaseUid: string; email: string }): Promise<InMemoryUser> | InMemoryUser;
  findByEmail(email: string): Promise<InMemoryUser | undefined> | InMemoryUser | undefined;
}

export class AdminRepository implements IAdminRepository {
  public async upsertUser(user: Partial<InMemoryUser> & { firebaseUid: string; email: string }): Promise<InMemoryUser> {
    return dbUpsertUser(user);
  }

  public async findByEmail(email: string): Promise<InMemoryUser | undefined> {
    return dbFindByEmail(email);
  }
}

export const adminRepository = new AdminRepository();
