import { SSMClient, GetParameterCommand, GetParametersByPathCommand } from '@aws-sdk/client-ssm';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { AppConfigClient, GetConfigurationCommand } from '@aws-sdk/client-appconfig';

interface Parameter {
  Name?: string;
  Value?: string;
}

export class ConfigManager {
  private ssm: SSMClient;
  private secretsManager: SecretsManagerClient;
  private appConfig: AppConfigClient;
  private paramPrefix: string;
  private secretsPrefix: string;
  private appConfigApp: string;
  private appConfigEnv: string;

  constructor(
    projectName: string,
    environment: string,
    region: string = 'us-east-1'
  ) {
    this.ssm = new SSMClient({ region });
    this.secretsManager = new SecretsManagerClient({ region });
    this.appConfig = new AppConfigClient({ region });
    this.paramPrefix = `/${projectName}/${environment}`;
    this.secretsPrefix = `${projectName}/${environment}`;
    this.appConfigApp = `${projectName}-${environment}`;
    this.appConfigEnv = environment;
  }

  // Parameter Store methods
  async getParameter(name: string, withDecryption: boolean = false): Promise<string> {
    const paramName = `${this.paramPrefix}/${name}`;
    const command = new GetParameterCommand({
      Name: paramName,
      WithDecryption: withDecryption
    });
    const response = await this.ssm.send(command);
    return response.Parameter?.Value || '';
  }

  async getParametersByPath(path: string, withDecryption: boolean = false): Promise<Record<string, string>> {
    const fullPath = `${this.paramPrefix}/${path}`;
    const command = new GetParametersByPathCommand({
      Path: fullPath,
      WithDecryption: withDecryption,
      Recursive: true
    });
    const response = await this.ssm.send(command);

    const params: Record<string, string> = {};
    response.Parameters?.forEach((param: Parameter) => {
      if (param.Name && param.Value) {
        const key = param.Name.replace(fullPath + '/', '');
        params[key] = param.Value;
      }
    });
    return params;
  }

  // Secrets Manager methods
  async getSecret(name: string): Promise<Record<string, string>> {
    const secretName = `${this.secretsPrefix}/${name}`;
    const command = new GetSecretValueCommand({
      SecretId: secretName
    });
    const response = await this.secretsManager.send(command);

    if (response.SecretString) {
      return JSON.parse(response.SecretString);
    }
    return {};
  }

  // AppConfig methods
  async getConfiguration(profile: string = 'default'): Promise<Record<string, any>> {
    try {
      const command = new GetConfigurationCommand({
        Application: this.appConfigApp,
        Environment: this.appConfigEnv,
        Configuration: profile,
        ClientId: 'default',
        ClientConfigurationVersion: '1'
      });
      
      const response = await this.appConfig.send(command);
      
      if (response.Content) {
        return JSON.parse(response.Content.toString());
      }
    } catch (error) {
      console.warn('Failed to fetch AppConfig:', error);
    }
    
    return {};
  }

  // Helper method to load all configuration
  async loadAllConfig(): Promise<{
    parameters: Record<string, string>;
    secrets: Record<string, Record<string, string>>;
    appConfig: Record<string, any>;
  }> {
    const [parameters, appConfig] = await Promise.all([
      this.getParametersByPath(''),
      this.getConfiguration()
    ]);

    // Load all secrets
    const secrets: Record<string, Record<string, string>> = {};
    try {
      const apiKeys = await this.getSecret('api-keys');
      secrets['api-keys'] = apiKeys;
    } catch (error) {
      console.warn('Failed to load api-keys secret:', error);
    }

    return {
      parameters,
      secrets,
      appConfig
    };
  }
} 