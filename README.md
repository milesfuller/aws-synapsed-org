# aws-synapsed-bootstrap
 Secure Multi-Account AWS Organization with Centralized Logging & Governance for SynapseD

This setup ensures a **secure AWS Organization** by implementing **centralized logging, security monitoring, compliance enforcement, and automated incident response**. We used **AWS CDK with TypeScript** to automate deployment.

---

## **1. AWS Organizations & IAM Roles**  
- Create **IAM roles** for centralized security & logging:  
- **Security Audit Role**: Allows the **Security Account** to audit other accounts.  
- **Logging Read Role**: Grants the **Logging Account** access to S3 logs.  

---

## **2. Centralized Security Monitoring**  
- Enable **AWS GuardDuty** for **threat detection** in all accounts.
- Enable **AWS Security Hub** to **aggregate security findings** across accounts.  

---

## **3. Compliance Enforcement with AWS Config**  
- Configure **AWS Config Rules** to enforce compliance:  
- **S3 Encryption Rule**: Ensures all S3 buckets are encrypted.  
- **IAM Root User Check**: Detects root account usage.  
- **MFA Enforcement Rule**: Requires MFA for IAM users.  

---

## **4. Automated Incident Response**  
- Create **AWS Lambda + EventBridge** for automatic security responses:  
- **Disables IAM users with suspicious activity**.  
- **Integrates with Security Hub for real-time incident detection**.  

---

## **5. Security Alerts with Amazon SNS**  
- Configure **Amazon SNS** to notify security teams about critical incidents:  
- **Email & SMS alerts for high-severity findings**.  

---

## **Prerequisites**
- Node.js installed

- AWS CDK installed (npm install -g aws-cdk)

- IAM permissions to manage AWS Organizations and other AWS services

- Bootstrapped AWS CDK (cdk bootstrap)

---
