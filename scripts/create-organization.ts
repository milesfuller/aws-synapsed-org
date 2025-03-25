import { 
    OrganizationsClient, 
    CreateOrganizationalUnitCommand,
    ListRootsCommand,
    CreateOrganizationCommand,
    DescribeOrganizationCommand
  } from '@aws-sdk/client-organizations';
  import * as dotenv from "dotenv";
  import * as fs from 'fs';
  import { get } from "env-var";
  
  dotenv.config();
  
  const client = new OrganizationsClient({ 
    region: get("CDK_DEFAULT_REGION").required().asString() 
  });
  
  async function createOrganizationStructure() {
    try {
      // Get or create organization
      let orgId;
      try {
        const describeOrgResponse = await client.send(new DescribeOrganizationCommand({}));
        orgId = describeOrgResponse.Organization?.Id;
      } catch (error) {
        const createOrgResponse = await client.send(new CreateOrganizationCommand({
          FeatureSet: 'ALL'
        }));
        orgId = createOrgResponse.Organization?.Id;
      }
  
      // Get the root ID
      const rootsResponse = await client.send(new ListRootsCommand({}));
      const rootId = rootsResponse.Roots?.[0].Id;
      
      if (!rootId || !orgId) {
        throw new Error('Root ID or Organization ID not found');
      }
  
      // Create main OUs
      const securityOU = await client.send(new CreateOrganizationalUnitCommand({
        ParentId: rootId,
        Name: 'Security'
      }));
  
      const workloadsOU = await client.send(new CreateOrganizationalUnitCommand({
        ParentId: rootId,
        Name: 'Workloads'
      }));
  
      // Update .env file with new values
      const envPath = '.env';
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update or add new values
      const updates = {
        AWS_ORG_ID: orgId,
        SECURITY_OU_ID: securityOU.OrganizationalUnit?.Id,
        WORKLOADS_OU_ID: workloadsOU.OrganizationalUnit?.Id
      };
  
      Object.entries(updates).forEach(([key, value]) => {
        const regex = new RegExp(`${key}=.*`);
        if (envContent.match(regex)) {
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          envContent += `\n${key}=${value}`;
        }
      });
  
      fs.writeFileSync(envPath, envContent);
  
      console.log('Organization structure created successfully');
      console.log('Environment variables updated in .env file');
      console.log('New values:', updates);
    } catch (error) {
      console.error('Error creating organization structure:', error);
    }
  }
  
  createOrganizationStructure();