import { InMemoryUser, dbFindByUid, dbUpsertUser } from '../shared/db/index.js';

export interface IAuthRepository {
  findByUid(uid: string): Promise<InMemoryUser | undefined> | InMemoryUser | undefined;
  upsertUser(user: Partial<InMemoryUser> & { firebaseUid: string; email: string }): Promise<InMemoryUser> | InMemoryUser;
}

export class AuthRepository implements IAuthRepository {
  public async findByUid(uid: string): Promise<InMemoryUser | undefined> {
    return dbFindByUid(uid);
  }

  public async upsertUser(user: Partial<InMemoryUser> & { firebaseUid: string; email: string }): Promise<InMemoryUser> {
    return dbUpsertUser(user);
  }
}

export const authRepository = new AuthRepository();
