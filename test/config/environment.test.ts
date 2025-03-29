import { getEnvironmentConfig, validateEmail, validatePhone, validateHighSeverityThreshold } from '../../lib/config/environment';
import { get } from 'env-var';

// Mock env-var
jest.mock('env-var', () => ({
  get: jest.fn()
}));

describe('Environment Configuration', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      expect(validateEmail('test@example.com')).toBe('test@example.com');
      expect(validateEmail('test.name@sub.example.com')).toBe('test.name@sub.example.com');
    });

    it('should throw error for invalid email format', () => {
      expect(() => validateEmail('invalid')).toThrow('Invalid email format');
      expect(() => validateEmail('test@')).toThrow('Invalid email format');
      expect(() => validateEmail('@example.com')).toThrow('Invalid email format');
      expect(() => validateEmail('test@example')).toThrow('Invalid email format');
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone number format', () => {
      expect(validatePhone('+1234567890')).toBe('+1234567890');
      expect(validatePhone('1234567890')).toBe('1234567890');
    });

    it('should handle undefined phone number', () => {
      expect(validatePhone(undefined)).toBeUndefined();
    });

    it('should throw error for invalid phone number format', () => {
      expect(() => validatePhone('invalid')).toThrow('Invalid phone number format');
      expect(() => validatePhone('123')).toThrow('Invalid phone number format');
      expect(() => validatePhone('+abc1234567')).toThrow('Invalid phone number format');
    });
  });

  describe('validateHighSeverityThreshold', () => {
    it('should validate threshold within range', () => {
      expect(validateHighSeverityThreshold(1)).toBe(1);
      expect(validateHighSeverityThreshold(5)).toBe(5);
      expect(validateHighSeverityThreshold(10)).toBe(10);
    });

    it('should throw error for threshold out of range', () => {
      expect(() => validateHighSeverityThreshold(0)).toThrow('High severity threshold must be between 1 and 10');
      expect(() => validateHighSeverityThreshold(11)).toThrow('High severity threshold must be between 1 and 10');
      expect(() => validateHighSeverityThreshold(NaN)).toThrow('High severity threshold must be between 1 and 10');
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return valid configuration with all required variables', () => {
      // Mock the get function to return valid values
      (get as jest.Mock).mockImplementation((key: string) => {
        const values: { [key: string]: any } = {
          'CDK_DEFAULT_ACCOUNT': { required: () => ({ asString: () => '123456789012' }) },
          'CDK_DEFAULT_REGION': { required: () => ({ asString: () => 'us-east-1' }) },
          'STACK_PREFIX': { default: () => ({ asString: () => 'Security' }) },
          'ENV_NAME': { default: () => ({ asString: () => 'Dev' }) },
          'PROJECT_NAME': { default: () => ({ asString: () => 'aws-synapsed-bootstrap' }) },
          'SECURITY_TEAM_EMAIL': { required: () => ({ asString: () => 'security@example.com' }) },
          'SECURITY_TEAM_PHONE': { asString: () => '+1234567890' },
          'HIGH_SEVERITY_THRESHOLD': { default: () => ({ asInt: () => 7 }) }
        };
        return values[key];
      });

      const config = getEnvironmentConfig();

      expect(config).toEqual({
        cdkDefaultAccount: '123456789012',
        cdkDefaultRegion: 'us-east-1',
        stackPrefix: 'Security',
        envName: 'Dev',
        projectName: 'aws-synapsed-bootstrap',
        securityTeamEmail: 'security@example.com',
        securityTeamPhone: '+1234567890',
        highSeverityThreshold: 7
      });
    });

    it('should use default values for optional variables', () => {
      (get as jest.Mock).mockImplementation((key: string) => {
        const values: { [key: string]: any } = {
          'CDK_DEFAULT_ACCOUNT': { required: () => ({ asString: () => '123456789012' }) },
          'CDK_DEFAULT_REGION': { required: () => ({ asString: () => 'us-east-1' }) },
          'STACK_PREFIX': { default: () => ({ asString: () => 'Security' }) },
          'ENV_NAME': { default: () => ({ asString: () => 'Dev' }) },
          'PROJECT_NAME': { default: () => ({ asString: () => 'aws-synapsed-bootstrap' }) },
          'SECURITY_TEAM_EMAIL': { required: () => ({ asString: () => 'security@example.com' }) },
          'SECURITY_TEAM_PHONE': { asString: () => undefined },
          'HIGH_SEVERITY_THRESHOLD': { default: () => ({ asInt: () => 7 }) }
        };
        return values[key];
      });

      const config = getEnvironmentConfig();

      expect(config.securityTeamPhone).toBeUndefined();
    });

    it('should throw error for missing required variables', () => {
      (get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'CDK_DEFAULT_ACCOUNT') {
          return { required: () => { throw new Error('CDK_DEFAULT_ACCOUNT is required'); } };
        }
        return { required: () => ({ asString: () => 'value' }) };
      });

      expect(() => getEnvironmentConfig()).toThrow('CDK_DEFAULT_ACCOUNT is required');
    });

    it('should handle empty phone number', () => {
      (get as jest.Mock).mockImplementation((key: string) => {
        const values: { [key: string]: any } = {
          'CDK_DEFAULT_ACCOUNT': { required: () => ({ asString: () => '123456789012' }) },
          'CDK_DEFAULT_REGION': { required: () => ({ asString: () => 'us-east-1' }) },
          'STACK_PREFIX': { default: () => ({ asString: () => 'Security' }) },
          'ENV_NAME': { default: () => ({ asString: () => 'Dev' }) },
          'PROJECT_NAME': { default: () => ({ asString: () => 'aws-synapsed-bootstrap' }) },
          'SECURITY_TEAM_EMAIL': { required: () => ({ asString: () => 'security@example.com' }) },
          'SECURITY_TEAM_PHONE': { asString: () => '' },
          'HIGH_SEVERITY_THRESHOLD': { default: () => ({ asInt: () => 7 }) }
        };
        return values[key];
      });

      const config = getEnvironmentConfig();
      expect(config.securityTeamPhone).toBe('');
    });
  });
}); 