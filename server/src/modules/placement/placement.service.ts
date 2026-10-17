import { eq, and, sql, or } from 'drizzle-orm';
import { db, dbFindStudentClassSectionId, dbFindUserByIdOrUid } from '../shared/db/index.js';
import {
  placementMembers,
  studentPlacementProfiles,
  placementDrives,
  classSections,
  users,
  driveApplications,
} from '../shared/db/schema.js';
import { invalidateCachedAuth } from '../shared/middleware/authCache.js';
import {
  AssignMemberInput,
  UpdateProfileInput,
  CreateDriveInput,
  UpdateDriveInput,
  ApplyDriveInput,
  UpdateApplicationStatusInput,
} from './placement.schema.js';
import { AuthenticatedUser } from '../shared/middleware/auth.js';

function validateFirebaseStorageUrl(url: string) {
  if (!url) return;
  // Simple check for Firebase storage host/prefix.
  // E.g., https://firebasestorage.googleapis.com/v0/b/...
  if (!url.includes('firebasestorage.googleapis.com')) {
    throw {
      statusCode: 400,
      code: 'INVALID_URL',
      message: 'URL must point to the authorized Firebase Storage bucket.',
    };
  }
}

export class PlacementService {
  /**
   * ADMIN ONLY: Assign or replace a placement head/member.
   */
  public async assignMember(
    currentUser: AuthenticatedUser,
    payload: AssignMemberInput
  ) {
    if (!db) throw new Error('Database connection required');
    const targetUser = await dbFindUserByIdOrUid(payload.userId);
    if (!targetUser || targetUser.institutionCode !== currentUser.institutionCode) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'User not found in this institution' };
    }

    const existing = await db.query.placementMembers.findFirst({
      where: and(
        eq(placementMembers.institutionCode, currentUser.institutionCode),
        eq(placementMembers.userId, targetUser.id)
      ),
    });

    if (existing) {
      await db
        .update(placementMembers)
        .set({ accessLevel: payload.accessLevel })
        .where(eq(placementMembers.id, existing.id));
    } else {
      await db.insert(placementMembers).values({
        institutionCode: currentUser.institutionCode,
        userId: targetUser.id,
        accessLevel: payload.accessLevel,
        grantedBy: currentUser.uid,
      });
    }

    // Invalidate the target user's auth cache so their new placementAccess is loaded on next request
    invalidateCachedAuth(targetUser.firebaseUid);

    return { message: 'Member assigned successfully' };
  }

  /**
   * STUDENT: Get own placement profile
   */
  public async getStudentProfile(currentUser: AuthenticatedUser) {
    if (!db) throw new Error('Database connection required');
    const userId = (await dbFindUserByIdOrUid(currentUser.uid))?.id;
    if (!userId) throw new Error('User ID resolution failed');

    let profile = await db.query.studentPlacementProfiles.findFirst({
      where: eq(studentPlacementProfiles.userId, userId),
    });

    if (!profile) {
      // Prefill from user data
      const user = await dbFindUserByIdOrUid(currentUser.uid);
      if (user) {
        profile = {
          id: '',
          userId: user.id,
          fullName: user.fullName || '',
          email: user.email,
          phone: user.phone || '',
          photoUrl: user.profilePicUrl || '',
          resumeUrl: '',
          cgpa: null,
          tenthPercent: user.tenthPercentage ? parseFloat(user.tenthPercentage) : null,
          twelfthOrDiplomaPercent: user.twelfthPercentage ? parseFloat(user.twelfthPercentage) : null,
          activeBacklogs: 0,
          portfolioUrl: '',
          linkedinUrl: '',
          githubUrl: '',
          leetcodeUrl: '',
          otherLinks: [],
          updatedAt: new Date(),
        } as any;
      }
    }

    // Resolve current branch/year dynamically from class mapping
    let branch = '';
    let year = '';
    const classSectionId = await dbFindStudentClassSectionId(userId);
    if (classSectionId) {
      const classSection = await db.query.classSections.findFirst({
        where: eq(classSections.id, classSectionId),
      });
      if (classSection) {
        branch = classSection.department || '';
        year = classSection.academicYear || '';
      }
    }

    return {
      ...profile,
      branch,
      year,
    };
  }

  /**
   * STUDENT: Update own placement profile
   */
  public async updateStudentProfile(currentUser: AuthenticatedUser, payload: UpdateProfileInput) {
    if (!db) throw new Error('Database connection required');
    const user = await dbFindUserByIdOrUid(currentUser.uid);
    if (!user) throw new Error('User not found');

    if (payload.resumeUrl) validateFirebaseStorageUrl(payload.resumeUrl);
    if (payload.photoUrl) validateFirebaseStorageUrl(payload.photoUrl);

    const existing = await db.query.studentPlacementProfiles.findFirst({
      where: eq(studentPlacementProfiles.userId, user.id),
    });

    let updated;
    if (existing) {
      const results = await db
        .update(studentPlacementProfiles)
        .set({
          ...payload,
          updatedAt: new Date(),
        })
        .where(eq(studentPlacementProfiles.userId, user.id))
        .returning();
      updated = results[0];
    } else {
      const results = await db
        .insert(studentPlacementProfiles)
        .values({
          userId: user.id,
          fullName: user.fullName || '',
          email: user.email,
          ...payload,
        })
        .returning();
      updated = results[0];
    }

    return { message: 'Profile updated successfully', profile: updated };
  }

  /**
   * STAFF: Create a new placement drive
   */
  public async createDrive(currentUser: AuthenticatedUser, payload: CreateDriveInput) {
    if (!db) throw new Error('Database connection required');
    if (payload.logoUrl) validateFirebaseStorageUrl(payload.logoUrl);
    if (payload.bannerUrl) validateFirebaseStorageUrl(payload.bannerUrl);

    const results = await db
      .insert(placementDrives)
      .values({
        institutionCode: currentUser.institutionCode || '',
        ...payload,
        minCgpa: payload.minCgpa?.toString(),
        applyDeadline: new Date(payload.applyDeadline),
        createdBy: currentUser.uid,
      })
      .returning();

    return { message: 'Drive created successfully', drive: results[0] };
  }

  /**
   * STAFF: Update an existing placement drive
   */
  public async updateDrive(currentUser: AuthenticatedUser, driveId: string, payload: UpdateDriveInput) {
    if (!db) throw new Error('Database connection required');
    if (payload.logoUrl) validateFirebaseStorageUrl(payload.logoUrl);
    if (payload.bannerUrl) validateFirebaseStorageUrl(payload.bannerUrl);

    const existing = await db.query.placementDrives.findFirst({
      where: and(
        eq(placementDrives.id, driveId),
        eq(placementDrives.institutionCode, currentUser.institutionCode || '')
      ),
    });

    if (!existing) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Drive not found' };
    }

    const updates: any = { ...payload, updatedAt: new Date() };
    if (payload.applyDeadline) updates.applyDeadline = new Date(payload.applyDeadline);
    if (payload.minCgpa !== undefined) updates.minCgpa = payload.minCgpa?.toString();

    const results = await db
      .update(placementDrives)
      .set(updates)
      .where(eq(placementDrives.id, driveId))
      .returning();

    return { message: 'Drive updated successfully', drive: results[0] };
  }

  /**
   * STAFF: Delete a placement drive
   */
  public async deleteDrive(currentUser: AuthenticatedUser, driveId: string) {
    if (!db) throw new Error('Database connection required');

    const existing = await db.query.placementDrives.findFirst({
      where: and(
        eq(placementDrives.id, driveId),
        eq(placementDrives.institutionCode, currentUser.institutionCode || '')
      ),
    });

    if (!existing) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Drive not found' };
    }

    await db.delete(placementDrives).where(eq(placementDrives.id, driveId));
    return { success: true };
  }

  /**
   * EVERYONE: Get drives (Students see only published, Staff see all)
   */
  public async listDrives(currentUser: AuthenticatedUser, accessLevel?: string | null) {
    if (!db) throw new Error('Database connection required');

    let conditions = [eq(placementDrives.institutionCode, currentUser.institutionCode || '')];
    
    if (accessLevel !== 'head' && accessLevel !== 'member') {
      // Student - Only published drives
      conditions.push(eq(placementDrives.status, 'published'));
    }

    const drives = await db
      .select()
      .from(placementDrives)
      .where(and(...conditions))
      .orderBy(sql`${placementDrives.createdAt} DESC`);

    if (accessLevel === 'head' || accessLevel === 'member') {
      return drives; // Return as-is for staff
    }

    // For students, compute eligibility for each drive
    const userId = (await dbFindUserByIdOrUid(currentUser.uid))?.id;
    let branch = '';
    let year = '';
    if (userId) {
      const classSectionId = await dbFindStudentClassSectionId(userId);
      if (classSectionId) {
        const classSection = await db.query.classSections.findFirst({
          where: eq(classSections.id, classSectionId),
        });
        if (classSection) {
          branch = classSection.department || '';
          year = classSection.academicYear || '';
        }
      }
    }

    const profile = userId ? await db.query.studentPlacementProfiles.findFirst({
      where: eq(studentPlacementProfiles.userId, userId),
    }) : null;

    return drives.map(drive => {
      let eligible = true;
      let ineligibilityReason = '';

      if (drive.allowedBranches && (drive.allowedBranches as string[]).length > 0) {
        if (!branch || !(drive.allowedBranches as string[]).includes(branch)) {
          eligible = false;
          ineligibilityReason = 'Your branch is not eligible for this drive.';
        }
      }
      
      if (eligible && drive.allowedYears && (drive.allowedYears as string[]).length > 0) {
        if (!year || !(drive.allowedYears as string[]).includes(year)) {
          eligible = false;
          ineligibilityReason = 'Your year of study is not eligible for this drive.';
        }
      }

      if (eligible && drive.minCgpa !== null && drive.minCgpa !== undefined) {
        if (!profile || profile.cgpa === null || Number(profile.cgpa) < Number(drive.minCgpa)) {
          eligible = false;
          ineligibilityReason = `Minimum CGPA required is ${drive.minCgpa}.`;
        }
      }

      if (eligible && drive.maxBacklogs !== null && drive.maxBacklogs !== undefined) {
        if (!profile || profile.activeBacklogs === null || profile.activeBacklogs > drive.maxBacklogs) {
          eligible = false;
          ineligibilityReason = `Maximum allowed active backlogs is ${drive.maxBacklogs}.`;
        }
      }

      return {
        ...drive,
        eligible,
        ineligibilityReason: eligible ? null : ineligibilityReason,
      };
    });
  }

  /**
   * STUDENT: Apply for a drive
   */
  public async applyForDrive(currentUser: AuthenticatedUser, driveId: string, payload: ApplyDriveInput) {
    if (!db) throw new Error('Database connection required');
    const userId = (await dbFindUserByIdOrUid(currentUser.uid))?.id;
    if (!userId) throw new Error('User not found');

    const drive = await db.query.placementDrives.findFirst({
      where: and(
        eq(placementDrives.id, driveId),
        eq(placementDrives.institutionCode, currentUser.institutionCode || '')
      ),
    });

    if (!drive) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Drive not found' };
    }
    if (drive.status !== 'published') {
      throw { statusCode: 400, code: 'INVALID_STATE', message: 'Drive is not published' };
    }
    if (new Date() > new Date(drive.applyDeadline)) {
      throw { statusCode: 400, code: 'DEADLINE_PASSED', message: 'Application deadline has passed' };
    }

    const drivesWithEligibility = await this.listDrives(currentUser, null);
    const driveStatus = drivesWithEligibility.find(d => d.id === driveId) as any;
    if (!driveStatus || !driveStatus.eligible) {
      throw { statusCode: 403, code: 'NOT_ELIGIBLE', message: driveStatus?.ineligibilityReason || 'Not eligible for this drive' };
    }

    const profile = await this.getStudentProfile(currentUser);
    const resumeUrl = payload.resumeUrl || profile.resumeUrl;

    if (!resumeUrl) {
      throw { statusCode: 400, code: 'MISSING_RESUME', message: 'A resume is required to apply' };
    }
    if (payload.resumeUrl) validateFirebaseStorageUrl(payload.resumeUrl);

    const existing = await db.query.driveApplications.findFirst({
      where: and(
        eq(driveApplications.driveId, driveId),
        eq(driveApplications.studentId, userId)
      ),
    });

    if (existing) {
      if (existing.status === 'withdrawn') {
        // Re-apply
        const result = await db
          .update(driveApplications)
          .set({
            status: 'applied',
            profileSnapshot: profile,
            resumeUrl,
            updatedAt: new Date(),
            appliedAt: new Date(),
          })
          .where(eq(driveApplications.id, existing.id))
          .returning();
        return { message: 'Application submitted successfully', application: result[0] };
      } else {
        throw { statusCode: 400, code: 'ALREADY_APPLIED', message: 'You have already applied for this drive' };
      }
    }

    const result = await db
      .insert(driveApplications)
      .values({
        driveId,
        studentId: userId,
        status: 'applied',
        profileSnapshot: profile,
        resumeUrl,
      })
      .returning();

    return { message: 'Application submitted successfully', application: result[0] };
  }

  /**
   * STUDENT: Withdraw application
   */
  public async withdrawApplication(currentUser: AuthenticatedUser, driveId: string) {
    if (!db) throw new Error('Database connection required');
    const userId = (await dbFindUserByIdOrUid(currentUser.uid))?.id;
    if (!userId) throw new Error('User not found');

    const drive = await db.query.placementDrives.findFirst({
      where: eq(placementDrives.id, driveId)
    });
    if (!drive || new Date() > new Date(drive.applyDeadline)) {
      throw { statusCode: 400, code: 'DEADLINE_PASSED', message: 'Cannot withdraw after the deadline' };
    }

    const existing = await db.query.driveApplications.findFirst({
      where: and(
        eq(driveApplications.driveId, driveId),
        eq(driveApplications.studentId, userId)
      ),
    });

    if (!existing || existing.status === 'withdrawn') {
      throw { statusCode: 400, code: 'NOT_APPLIED', message: 'No active application found' };
    }

    const result = await db
      .update(driveApplications)
      .set({
        status: 'withdrawn',
        withdrawnAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(driveApplications.id, existing.id))
      .returning();

    return { message: 'Application withdrawn successfully', application: result[0] };
  }

  /**
   * STUDENT: List own applications
   */
  public async listStudentApplications(currentUser: AuthenticatedUser) {
    if (!db) throw new Error('Database connection required');
    const userId = (await dbFindUserByIdOrUid(currentUser.uid))?.id;
    if (!userId) throw new Error('User not found');

    const applications = await db.query.driveApplications.findMany({
      where: eq(driveApplications.studentId, userId),
      orderBy: (apps, { desc }) => [desc(apps.appliedAt)],
    });

    return applications;
  }

  /**
   * STAFF: Get all applications for a specific drive
   */
  public async getDriveApplications(currentUser: AuthenticatedUser, driveId: string) {
    if (!db) throw new Error('Database connection required');

    if (!db) throw new Error('Database connection required');

    // Make sure the drive belongs to their institution
    const drive = await db.query.placementDrives.findFirst({
      where: and(
        eq(placementDrives.id, driveId),
        eq(placementDrives.institutionCode, currentUser.institutionCode || '')
      ),
    });

    if (!drive) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Drive not found' };
    }

    const applications = await db.query.driveApplications.findMany({
      where: eq(driveApplications.driveId, driveId),
      orderBy: (apps, { desc }) => [desc(apps.appliedAt)],
      with: {
        student: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profilePicUrl: true,
            tenthPercentage: true,
            twelfthPercentage: true,
          },
        },
      },
    });

    // Enrich with branch and year
    const enriched = await Promise.all(
      applications.map(async (app) => {
        let branch = 'N/A';
        let year = 'N/A';
        try {
          const classSectionId = await dbFindStudentClassSectionId(app.studentId);
          if (classSectionId) {
            const classRow = await db!.query.classSections.findFirst({
              where: eq(classSections.id, classSectionId),
            });
            if (classRow) {
              branch = classRow.department || 'N/A';
              year = classRow.academicYear || 'N/A';
            }
          }
        } catch (e) {
          // ignore
        }
        return {
          ...app,
          student: {
            ...(app.student as any || {}),
            branch,
            year,
          },
        };
      })
    );

    return enriched;
  }

  /**
   * STAFF: Update application status
   */
  public async updateApplicationStatus(
    currentUser: AuthenticatedUser,
    driveId: string,
    applicationId: string,
    payload: UpdateApplicationStatusInput
  ) {
    if (!db) throw new Error('Database connection required');

    const drive = await db.query.placementDrives.findFirst({
      where: and(
        eq(placementDrives.id, driveId),
        eq(placementDrives.institutionCode, currentUser.institutionCode || '')
      ),
    });

    if (!drive) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Drive not found' };
    }

    const result = await db
      .update(driveApplications)
      .set({
        status: payload.status,
        ...(payload.currentRoundIndex !== undefined ? { currentRoundIndex: payload.currentRoundIndex } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(driveApplications.id, applicationId), eq(driveApplications.driveId, driveId)))
      .returning();

    if (result.length === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Application not found' };
    }

    return { message: 'Application status updated', application: result[0] };
  }
  public async searchEligibleMembers(user: { uid: string; institutionCode?: string }) {
    if (!db) throw new Error('Database not initialized');
    
    const eligibleUsers = await db.query.users.findMany({
      where: and(
        eq(users.institutionCode, user.institutionCode || ''),
        or(
          eq(users.role, 'teacher'),
          eq(users.role, 'admin'),
          eq(users.role, 'hod')
        )
      ),
      columns: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        profilePicUrl: true,
      }
    });

    return eligibleUsers.map((u) => ({
      ...u,
      profilePic: u.profilePicUrl,
    }));
  }

  public async listMembers(user: { uid: string; institutionCode?: string }) {
    if (!db) throw new Error('Database not initialized');
    
    const members = await db.query.placementMembers.findMany({
      where: eq(placementMembers.institutionCode, user.institutionCode || ''),
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            profilePicUrl: true,
          }
        }
      }
    });
    
    return members.map(m => {
      const u = m.user as any;
      return {
        id: u?.id || m.userId,
        fullName: u?.fullName || 'Member',
        email: u?.email || '',
        role: u?.role || 'staff',
        profilePic: u?.profilePicUrl || '',
        accessLevel: m.accessLevel,
        addedAt: m.createdAt,
      };
    });
  }

  public async listStudents(currentUser: AuthenticatedUser) {
    if (!db) throw new Error('Database not initialized');

    const students = await db.query.users.findMany({
      where: and(
        eq(users.institutionCode, currentUser.institutionCode || ''),
        eq(users.role, 'student')
      ),
      columns: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        profilePicUrl: true,
        rollNoOrUSN: true,
        tenthPercentage: true,
        twelfthPercentage: true,
      },
    });

    const studentIds = students.map((s) => s.id);
    let profilesMap: Record<string, any> = {};

    if (studentIds.length > 0) {
      const profiles = await db.query.studentPlacementProfiles.findMany({
        where: sql`${studentPlacementProfiles.userId} IN ${studentIds}`,
      });
      for (const p of profiles) {
        profilesMap[p.userId] = p;
      }
    }

    const enriched = await Promise.all(
      students.map(async (st) => {
        let branch = '';
        let year = '';
        try {
          const csId = await dbFindStudentClassSectionId(st.id);
          if (csId) {
            const cs = await db!.query.classSections.findFirst({
              where: eq(classSections.id, csId),
            });
            if (cs) {
              branch = cs.department || '';
              year = cs.academicYear || '';
            }
          }
        } catch {}

        const profile = profilesMap[st.id] || null;

        return {
          id: st.id,
          fullName: st.fullName,
          email: st.email,
          phone: st.phone || profile?.phone || '',
          rollNoOrUSN: st.rollNoOrUSN || '',
          profilePic: st.profilePicUrl || profile?.photoUrl || '',
          branch: branch || 'General',
          academicYear: year || 'N/A',
          cgpa: profile?.cgpa ? parseFloat(profile.cgpa) : null,
          tenthPercent: profile?.tenthPercent ? parseFloat(profile.tenthPercent) : (st.tenthPercentage ? parseFloat(st.tenthPercentage) : null),
          twelfthPercent: profile?.twelfthOrDiplomaPercent ? parseFloat(profile.twelfthOrDiplomaPercent) : (st.twelfthPercentage ? parseFloat(st.twelfthPercentage) : null),
          activeBacklogs: profile?.activeBacklogs ?? 0,
          resumeUrl: profile?.resumeUrl || '',
          portfolioUrl: profile?.portfolioUrl || '',
          linkedinUrl: profile?.linkedinUrl || '',
          githubUrl: profile?.githubUrl || '',
          leetcodeUrl: profile?.leetcodeUrl || '',
        };
      })
    );

    return enriched;
  }

  public async getStats(currentUser: AuthenticatedUser) {
    if (!db) throw new Error('Database not initialized');

    const instCode = currentUser.institutionCode || '';

    const [drives, apps, members, studentsCount] = await Promise.all([
      db.query.placementDrives.findMany({
        where: eq(placementDrives.institutionCode, instCode),
      }),
      db.query.driveApplications.findMany({
        where: sql`${driveApplications.driveId} IN (SELECT id FROM ${placementDrives} WHERE ${placementDrives.institutionCode} = ${instCode})`,
      }),
      db.query.placementMembers.findMany({
        where: eq(placementMembers.institutionCode, instCode),
      }),
      db.query.users.findMany({
        where: and(eq(users.institutionCode, instCode), eq(users.role, 'student')),
        columns: { id: true },
      }),
    ]);

    const activeDrives = drives.filter((d) => d.status === 'published').length;
    const closedDrives = drives.filter((d) => d.status === 'closed').length;
    const draftDrives = drives.filter((d) => d.status === 'draft').length;
    const hiredCount = apps.filter((a) => a.status === 'hired').length;
    const shortlistedCount = apps.filter((a) => a.status === 'shortlisted').length;

    return {
      totalDrives: drives.length,
      activeDrives,
      closedDrives,
      draftDrives,
      totalApplications: apps.length,
      hiredCount,
      shortlistedCount,
      totalMembers: members.length,
      totalStudents: studentsCount.length,
    };
  }
}

export const placementService = new PlacementService();
