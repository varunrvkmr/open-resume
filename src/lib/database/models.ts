// Database models for OpenResume backend
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

// UserAuth model
export interface UserAuthAttributes {
  id: number;
  email: string;
  password_hash?: string;
  okta_sub?: string;
}

export interface UserAuthCreationAttributes extends Optional<UserAuthAttributes, 'id'> {}

export class UserAuth extends Model<UserAuthAttributes, UserAuthCreationAttributes> implements UserAuthAttributes {
  public id!: number;
  public email!: string;
  public password_hash?: string;
  public okta_sub?: string;

  public static initialize(sequelize: Sequelize): typeof UserAuth {
    UserAuth.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      okta_sub: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true
      }
    }, {
      sequelize,
      tableName: 'auth_users',
      timestamps: false
    });
    return UserAuth;
  }
}

// JobPosting model
export interface JobPostingAttributes {
  id: number;
  user_auth_id: number;
  company: string;
  job_title: string;
  job_description?: string;
  job_link?: string;
  location?: string;
  country?: string;
  posting_status?: string;
  job_platform?: string;
  date_applied?: Date;
  user_notes?: string;
}

export interface JobPostingCreationAttributes extends Optional<JobPostingAttributes, 'id'> {}

export class JobPosting extends Model<JobPostingAttributes, JobPostingCreationAttributes> implements JobPostingAttributes {
  public id!: number;
  public user_auth_id!: number;
  public company!: string;
  public job_title!: string;
  public job_description?: string;
  public job_link?: string;
  public location?: string;
  public country?: string;
  public posting_status?: string;
  public job_platform?: string;
  public date_applied?: Date;
  public user_notes?: string;

  public static initialize(sequelize: Sequelize): typeof JobPosting {
    JobPosting.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_auth_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'auth_users',
          key: 'id'
        }
      },
      company: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      job_title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      job_description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      job_link: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      posting_status: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      job_platform: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      date_applied: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      user_notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'job_posting',
      timestamps: false
    });
    return JobPosting;
  }
}

// ResumeVersion model
export interface ResumeVersionAttributes {
  id: number;
  user_auth_id: number;
  job_posting_id?: number;
  version_name: string;
  is_master: boolean;
  parent_version_id?: number;
  resume_data: any; // JSON
  job_analysis?: any; // JSON
  modifications_made?: any; // JSON
  tailoring_prompt?: string;
  status: string;
  last_used_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface ResumeVersionCreationAttributes extends Optional<ResumeVersionAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class ResumeVersion extends Model<ResumeVersionAttributes, ResumeVersionCreationAttributes> implements ResumeVersionAttributes {
  public id!: number;
  public user_auth_id!: number;
  public job_posting_id?: number;
  public version_name!: string;
  public is_master!: boolean;
  public parent_version_id?: number;
  public resume_data!: any;
  public job_analysis?: any;
  public modifications_made?: any;
  public tailoring_prompt?: string;
  public status!: string;
  public last_used_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): typeof ResumeVersion {
    ResumeVersion.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_auth_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'auth_users',
          key: 'id'
        }
      },
      job_posting_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'job_posting',
          key: 'id'
        }
      },
      version_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      is_master: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      parent_version_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'resume_versions',
          key: 'id'
        }
      },
      resume_data: {
        type: DataTypes.JSON,
        allowNull: false
      },
      job_analysis: {
        type: DataTypes.JSON,
        allowNull: true
      },
      modifications_made: {
        type: DataTypes.JSON,
        allowNull: true
      },
      tailoring_prompt: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'draft'
      },
      last_used_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'resume_versions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
    return ResumeVersion;
  }
}

// UserMasterResume model
export interface UserMasterResumeAttributes {
  id: number;
  user_auth_id: number;
  name: string;
  email: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: string;
  work_experiences?: any; // JSON
  educations?: any; // JSON
  projects?: any; // JSON
  skills?: any; // JSON
  custom_sections?: any; // JSON
  theme_settings?: any; // JSON
  last_used_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserMasterResumeCreationAttributes extends Optional<UserMasterResumeAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class UserMasterResume extends Model<UserMasterResumeAttributes, UserMasterResumeCreationAttributes> implements UserMasterResumeAttributes {
  public id!: number;
  public user_auth_id!: number;
  public name!: string;
  public email!: string;
  public phone?: string;
  public url?: string;
  public summary?: string;
  public location?: string;
  public work_experiences?: any;
  public educations?: any;
  public projects?: any;
  public skills?: any;
  public custom_sections?: any;
  public theme_settings?: any;
  public last_used_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public toOpenResumeFormat(): any {
    return {
      basics: {
        name: this.name,
        email: this.email,
        phone: this.phone || "",
        url: this.url || "",
        summary: this.summary || "",
        location: this.location || ""
      },
      work: this.work_experiences || [],
      education: this.educations || [],
      projects: this.projects || [],
      skills: this.skills || [],
      custom: this.custom_sections || [],
      settings: this.theme_settings || {}
    };
  }

  public static fromOpenResumeFormat(userAuthId: number, resumeData: any): Partial<UserMasterResumeAttributes> {
    const basics = resumeData.basics || {};
    
    return {
      user_auth_id: userAuthId,
      name: basics.name || "",
      email: basics.email || "",
      phone: basics.phone || "",
      url: basics.url || "",
      summary: basics.summary || "",
      location: basics.location || "",
      work_experiences: resumeData.work || [],
      educations: resumeData.education || [],
      projects: resumeData.projects || [],
      skills: resumeData.skills || [],
      custom_sections: resumeData.custom || [],
      theme_settings: resumeData.settings || {}
    };
  }

  public static initialize(sequelize: Sequelize): typeof UserMasterResume {
    UserMasterResume.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_auth_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'auth_users',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      url: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      work_experiences: {
        type: DataTypes.JSON,
        allowNull: true
      },
      educations: {
        type: DataTypes.JSON,
        allowNull: true
      },
      projects: {
        type: DataTypes.JSON,
        allowNull: true
      },
      skills: {
        type: DataTypes.JSON,
        allowNull: true
      },
      custom_sections: {
        type: DataTypes.JSON,
        allowNull: true
      },
      theme_settings: {
        type: DataTypes.JSON,
        allowNull: true
      },
      last_used_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'user_master_resume',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
    return UserMasterResume;
  }
}

// Initialize all models and associations
export function initializeModels(sequelize: Sequelize) {
  // Initialize models
  UserAuth.initialize(sequelize);
  JobPosting.initialize(sequelize);
  ResumeVersion.initialize(sequelize);
  UserMasterResume.initialize(sequelize);

  // Define associations
  UserAuth.hasMany(JobPosting, { foreignKey: 'user_auth_id', as: 'jobPostings' });
  JobPosting.belongsTo(UserAuth, { foreignKey: 'user_auth_id', as: 'user' });

  UserAuth.hasMany(ResumeVersion, { foreignKey: 'user_auth_id', as: 'resumeVersions' });
  ResumeVersion.belongsTo(UserAuth, { foreignKey: 'user_auth_id', as: 'user' });

  JobPosting.hasMany(ResumeVersion, { foreignKey: 'job_posting_id', as: 'tailoredResumes' });
  ResumeVersion.belongsTo(JobPosting, { foreignKey: 'job_posting_id', as: 'jobPosting' });

  UserAuth.hasOne(UserMasterResume, { foreignKey: 'user_auth_id', as: 'masterResume' });
  UserMasterResume.belongsTo(UserAuth, { foreignKey: 'user_auth_id', as: 'user' });
}