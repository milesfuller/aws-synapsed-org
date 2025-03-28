import { OrganizationsClient, CreateAccountCommand, DescribeCreateAccountStatusCommand } from '@aws-sdk/client-organizations';
import * as dotenv from "dotenv"; 
import { get } from "env-var";

dotenv.config();

const CDK_DEFAULT_ACCOUNT = get("CDK_DEFAULT_ACCOUNT").required().asString();
const CDK_DEFAULT_REGION = get("CDK_DEFAULT_REGION").required().asString();
const SYNAPSED_EMAIL = get("SYNAPSED_EMAIL").required().asString();
const ENVIRONMENT = get("ENVIRONMENT").required().asString();

const client = new OrganizationsClient({ region: CDK_DEFAULT_REGION });

async function createAccount() {
  const command = new CreateAccountCommand({
    Email: SYNAPSED_EMAIL,
    AccountName: `SynapseD-${ENVIRONMENT}`,
    RoleName: "OrganizationAccountAccessRole",
  });

  try {
    const response = await client.send(command);
    const accountId = response.CreateAccountStatus?.Id;
    console.log("Account creation initiated:", accountId);

    // Wait for account creation to complete
    if (accountId) {
      await waitForAccountCreation(accountId);
    }
  } catch (error) {
    console.error("Error creating account:", error);
    process.exit(1);
  }
}

async function waitForAccountCreation(requestId: string) {
  while (true) {
    const command = new DescribeCreateAccountStatusCommand({
      CreateAccountRequestId: requestId
    });

    const response = await client.send(command);
    const status = response.CreateAccountStatus?.State;

    if (status === 'SUCCEEDED') {
      console.log('Account created successfully!');
      console.log('Account ID:', response.CreateAccountStatus?.AccountId);
      break;
    } else if (status === 'FAILED') {
      console.error('Account creation failed:', response.CreateAccountStatus?.FailureReason);
      process.exit(1);
    }

    // Wait 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

createAccount();