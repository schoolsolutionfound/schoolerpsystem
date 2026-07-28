import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as schema from './schema.js';

export interface InMemoryUser {
  id: string;
  firebaseUid: string;
  email: string;
  fullName: string;
  role: string;
  institutionCode: string;
  institutionName: string;
  institutionType: string;
  rollNoOrUSN: string;
  mustChangePassword: boolean;
  profileCompleted: boolean;
  parentPhone?: string;
  studentPhone?: string;
  profilePicUrl?: string;
  tenthPercentage?: string;
  twelfthPercentage?: string;
  title?: string;
  scope?: string;
  permissions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserStore {
  private usersMap = new Map<string, InMemoryUser>();

  public findByUid(uid: string): InMemoryUser | undefined {
    return Array.from(this.usersMap.values()).find((u) => u.firebaseUid === uid);
  }

  public findByEmail(email: string): InMemoryUser | undefined {
    return Array.from(this.usersMap.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public upsertUser(user: Partial<InMemoryUser> & { firebaseUid: string; email: string }): InMemoryUser {
    const existing = this.findByUid(user.firebaseUid);
    const updated: InMemoryUser = {
      id: existing?.id || user.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      firebaseUid: user.firebaseUid,
      email: user.email,
      fullName: user.fullName ?? existing?.fullName ?? 'User',
      role: user.role ?? existing?.role ?? 'student',
      institutionCode: user.institutionCode ?? existing?.institutionCode ?? '',
      institutionName: user.institutionName ?? existing?.institutionName ?? '',
      institutionType: user.institutionType ?? existing?.institutionType ?? 'school',
      rollNoOrUSN: user.rollNoOrUSN ?? existing?.rollNoOrUSN ?? '',
      mustChangePassword: user.mustChangePassword ?? existing?.mustChangePassword ?? false,
      profileCompleted: user.profileCompleted ?? existing?.profileCompleted ?? false,
      parentPhone: user.parentPhone ?? existing?.parentPhone ?? '',
      studentPhone: user.studentPhone ?? existing?.studentPhone ?? '',
      profilePicUrl: user.profilePicUrl ?? existing?.profilePicUrl ?? '',
      tenthPercentage: user.tenthPercentage ?? existing?.tenthPercentage ?? '',
      twelfthPercentage: user.twelfthPercentage ?? existing?.twelfthPercentage ?? '',
      title: user.title ?? existing?.title ?? '',
      scope: user.scope ?? existing?.scope ?? '{}',
      permissions: user.permissions ?? existing?.permissions ?? '[]',
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    this.usersMap.set(updated.id, updated);
    return updated;
  }

  public getAll(): InMemoryUser[] {
    return Array.from(this.usersMap.values());
  }

  public deleteUser(id: string): boolean {
    return this.usersMap.delete(id);
  }
}

export const inMemoryUserStore = new UserStore();

const connectionString = process.env.DATABASE_URL;
export const queryClient = connectionString ? postgres(connectionString) : null;
export const db = queryClient ? drizzle(queryClient, { schema }) : null;

export async function dbFindByUid(uid: string): Promise<InMemoryUser | undefined> {
  if (db) {
    try {
      const results = await db.select().from(schema.users).where(eq(schema.users.firebaseUid, uid)).limit(1);
      if (results.length > 0) {
        const row = results[0];
        const user: InMemoryUser = {
          id: row.id,
          firebaseUid: row.firebaseUid,
          email: row.email,
          fullName: row.fullName,
          role: row.role,
          institutionCode: row.institutionCode || '',
          institutionName: row.institutionName || '',
          institutionType: row.institutionType || 'school',
          rollNoOrUSN: row.rollNoOrUSN || '',
          mustChangePassword: row.mustChangePassword ?? false,
          profileCompleted: row.profileCompleted ?? false,
          parentPhone: row.parentPhone || '',
          studentPhone: row.studentPhone || '',
          profilePicUrl: row.profilePicUrl || '',
          tenthPercentage: row.tenthPercentage || '',
          twelfthPercentage: row.twelfthPercentage || '',
          title: row.title || '',
          scope: row.scope || '{}',
          permissions: row.permissions || '[]',
          createdAt: row.createdAt || new Date(),
          updatedAt: row.updatedAt || new Date(),
        };
        inMemoryUserStore.upsertUser(user);
        return user;
      }
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbFindByUid query failed:', error.message);
    }
  }
  return inMemoryUserStore.findByUid(uid);
}

export async function dbFindByEmail(email: string): Promise<InMemoryUser | undefined> {
  if (db) {
    try {
      const results = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      if (results.length > 0) {
        const row = results[0];
        const user: InMemoryUser = {
          id: row.id,
          firebaseUid: row.firebaseUid,
          email: row.email,
          fullName: row.fullName,
          role: row.role,
          institutionCode: row.institutionCode || '',
          institutionName: row.institutionName || '',
          institutionType: row.institutionType || 'school',
          rollNoOrUSN: row.rollNoOrUSN || '',
          mustChangePassword: row.mustChangePassword ?? false,
          profileCompleted: row.profileCompleted ?? false,
          parentPhone: row.parentPhone || '',
          studentPhone: row.studentPhone || '',
          profilePicUrl: row.profilePicUrl || '',
          tenthPercentage: row.tenthPercentage || '',
          twelfthPercentage: row.twelfthPercentage || '',
          title: row.title || '',
          scope: row.scope || '{}',
          permissions: row.permissions || '[]',
          createdAt: row.createdAt || new Date(),
          updatedAt: row.updatedAt || new Date(),
        };
        inMemoryUserStore.upsertUser(user);
        return user;
      }
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbFindByEmail query failed:', error.message);
    }
  }
  return inMemoryUserStore.findByEmail(email);
}

export async function dbUpsertUser(user: Partial<InMemoryUser> & { firebaseUid: string; email: string }): Promise<InMemoryUser> {
  const updatedUser = inMemoryUserStore.upsertUser(user);

  if (db) {
    try {
      await db.insert(schema.users).values({
        id: updatedUser.id,
        firebaseUid: updatedUser.firebaseUid,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        institutionCode: updatedUser.institutionCode,
        institutionName: updatedUser.institutionName,
        institutionType: updatedUser.institutionType,
        rollNoOrUSN: updatedUser.rollNoOrUSN,
        mustChangePassword: updatedUser.mustChangePassword,
        profileCompleted: updatedUser.profileCompleted,
        parentPhone: updatedUser.parentPhone,
        studentPhone: updatedUser.studentPhone,
        profilePicUrl: updatedUser.profilePicUrl,
        tenthPercentage: updatedUser.tenthPercentage,
        twelfthPercentage: updatedUser.twelfthPercentage,
        title: updatedUser.title,
        scope: updatedUser.scope,
        permissions: updatedUser.permissions,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      }).onConflictDoUpdate({
        target: schema.users.firebaseUid,
        set: {
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          institutionCode: updatedUser.institutionCode,
          institutionName: updatedUser.institutionName,
          institutionType: updatedUser.institutionType,
          rollNoOrUSN: updatedUser.rollNoOrUSN,
          mustChangePassword: updatedUser.mustChangePassword,
          profileCompleted: updatedUser.profileCompleted,
          parentPhone: updatedUser.parentPhone,
          studentPhone: updatedUser.studentPhone,
          profilePicUrl: updatedUser.profilePicUrl,
          tenthPercentage: updatedUser.tenthPercentage,
          twelfthPercentage: updatedUser.twelfthPercentage,
          title: updatedUser.title,
          scope: updatedUser.scope,
          permissions: updatedUser.permissions,
          updatedAt: new Date(),
        },
      });
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbUpsertUser query failed:', error.message);
    }
  }

  return updatedUser;
}

export async function dbGetAllUsers(): Promise<InMemoryUser[]> {
  if (db) {
    try {
      const results = await db.select().from(schema.users);
      if (results.length > 0) {
        const users: InMemoryUser[] = results.map((row) => ({
          id: row.id,
          firebaseUid: row.firebaseUid,
          email: row.email,
          fullName: row.fullName,
          role: row.role,
          institutionCode: row.institutionCode || '',
          institutionName: row.institutionName || '',
          institutionType: row.institutionType || 'school',
          rollNoOrUSN: row.rollNoOrUSN || '',
          mustChangePassword: row.mustChangePassword ?? false,
          profileCompleted: row.profileCompleted ?? false,
          parentPhone: row.parentPhone || '',
          studentPhone: row.studentPhone || '',
          profilePicUrl: row.profilePicUrl || '',
          tenthPercentage: row.tenthPercentage || '',
          twelfthPercentage: row.twelfthPercentage || '',
          title: row.title || '',
          scope: row.scope || '{}',
          permissions: row.permissions || '[]',
          createdAt: row.createdAt || new Date(),
          updatedAt: row.updatedAt || new Date(),
        }));
        users.forEach((u) => inMemoryUserStore.upsertUser(u));
        return users;
      }
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbGetAllUsers query failed:', error.message);
    }
  }
  return inMemoryUserStore.getAll();
}

export async function dbDeleteUserById(id: string): Promise<boolean> {
  inMemoryUserStore.deleteUser(id);
  if (db) {
    try {
      await db.delete(schema.users).where(eq(schema.users.id, id));
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbDeleteUserById query failed:', error.message);
    }
  }
  return true;
}

