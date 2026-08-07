import { institutionRepository, IInstitutionRepository } from './institution.repository.js';
import { CreateInstitutionInput, UpdateInstitutionInput } from './institution.schema.js';

export class InstitutionService {
  constructor(private repo: IInstitutionRepository = institutionRepository) {}

  public async createInstitution(input: CreateInstitutionInput) {
    const existing = await this.repo.findByCode(input.institutionCode);
    if (existing) {
      throw {
        statusCode: 409,
        code: 'INSTITUTION_CODE_EXISTS',
        message: `An institution with code "${input.institutionCode}" already exists.`,
      };
    }

    const created = await this.repo.create({
      institutionCode: input.institutionCode.toUpperCase().trim(),
      institutionName: input.institutionName.trim(),
      institutionType: input.institutionType || 'college',
      subscriptionStatus: input.subscriptionStatus || 'active',
      departments: input.departments ?? [],
      academicYears: input.academicYears ?? [],
      courses: input.courses ?? [],
    });

    return created;
  }

  public async getInstitutions() {
    return this.repo.findAll();
  }

  public async getInstitutionById(id: string) {
    const item = await this.repo.findById(id);
    if (!item) {
      throw {
        statusCode: 404,
        code: 'INSTITUTION_NOT_FOUND',
        message: `Institution with ID "${id}" was not found.`,
      };
    }
    return item;
  }

  public async updateInstitution(id: string, input: UpdateInstitutionInput) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw {
        statusCode: 404,
        code: 'INSTITUTION_NOT_FOUND',
        message: `Institution with ID "${id}" was not found.`,
      };
    }

    const updated = await this.repo.update(id, input);
    return updated;
  }

  public async deleteInstitution(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw {
        statusCode: 404,
        code: 'INSTITUTION_NOT_FOUND',
        message: `Institution with ID "${id}" was not found.`,
      };
    }

    await this.repo.delete(id);
    return { message: 'Institution deleted successfully' };
  }
}

export const institutionService = new InstitutionService();
