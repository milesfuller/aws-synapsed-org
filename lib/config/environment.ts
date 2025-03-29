import { get } from "env-var";

export interface EnvironmentConfig {
  // AWS Configuration
  cdkDefaultAccount: string;
  cdkDefaultRegion: string;
  
  // Stack Configuration
  stackPrefix: string;
  envName: string;
  projectName: string;
  
  // Security Configuration
  securityTeamEmail: string;
  securityTeamPhone?: string;
  highSeverityThreshold: number;
}

/**
 * Validates an email address format
 * @param email The email address to validate
 * @returns The validated email address
 * @throws Error if the email format is invalid
 */
export function validateEmail(email: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
  return email;
}

/**
 * Validates a phone number format
 * @param phone The phone number to validate
 * @returns The validated phone number
 * @throws Error if the phone number format is invalid
 */
export function validatePhone(phone: string | undefined): string | undefined {
  if (phone) {
    const phoneRegex = /^\+?[1-9]\d{7,14}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error("Invalid phone number format");
    }
  }
  return phone;
}

/**
 * Validates the high severity threshold
 * @param threshold The threshold value to validate
 * @returns The validated threshold value
 * @throws Error if the threshold is not between 1 and 10
 */
export function validateHighSeverityThreshold(threshold: number): number {
  if (isNaN(threshold) || threshold < 1 || threshold > 10) {
    throw new Error("High severity threshold must be between 1 and 10");
  }
  return threshold;
}

/**
 * Validates and returns the environment configuration
 * @throws {Error} If required environment variables are missing or invalid
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // AWS Configuration
  const cdkDefaultAccount = get("CDK_DEFAULT_ACCOUNT")
    .required()
    .asString();
    
  const cdkDefaultRegion = get("CDK_DEFAULT_REGION")
    .required()
    .asString();
    
  // Stack Configuration
  const stackPrefix = get("STACK_PREFIX")
    .default("Security")
    .asString();
    
  const envName = get("ENV_NAME")
    .default("Dev")
    .asString();
    
  const projectName = get("PROJECT_NAME")
    .default("aws-synapsed-bootstrap")
    .asString();
    
  // Security Configuration
  const securityTeamEmail = validateEmail(
    get("SECURITY_TEAM_EMAIL")
      .required()
      .asString()
  );
    
  const securityTeamPhone = validatePhone(
    get("SECURITY_TEAM_PHONE")
      .asString()
  );
    
  const highSeverityThreshold = validateHighSeverityThreshold(
    get("HIGH_SEVERITY_THRESHOLD")
      .default("7")
      .asInt()
  );

  return {
    cdkDefaultAccount,
    cdkDefaultRegion,
    stackPrefix,
    envName,
    projectName,
    securityTeamEmail,
    securityTeamPhone,
    highSeverityThreshold
  };
} 