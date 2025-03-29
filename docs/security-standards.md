# Security Standards and Monitoring

This document outlines the security standards and monitoring capabilities implemented in the Security Monitoring Stack. The stack uses AWS Security Hub and GuardDuty to provide comprehensive security monitoring and compliance checking across your AWS environment.

## GuardDuty Configuration

Amazon GuardDuty is configured with the following features:

- **Finding Publishing Frequency**: Set to FIFTEEN_MINUTES by default for near real-time threat detection
- **S3 Logs Monitoring**: Enabled to detect suspicious activities in S3 buckets
- **Kubernetes Audit Logs**: Optional monitoring of EKS cluster activities
- **Malware Protection**: Optional scanning of EBS volumes for malware

## Security Standards

### 1. AWS Foundational Security Best Practices (FSBP) v1.0.0

AWS FSBP is a set of automated security checks that detect when AWS accounts and deployed resources deviate from security best practices. Key areas include:

- **IAM**: User, role, and permission management best practices
- **Logging**: CloudTrail, CloudWatch, and VPC Flow Logs configuration
- **Encryption**: KMS key usage and data encryption
- **Network Security**: VPC configuration, security groups, and NACLs
- **Resilience**: Backup and recovery configurations
- **Resource Configuration**: Security settings for EC2, S3, RDS, and other services

### 2. CIS AWS Foundations Benchmark v1.2.0

The Center for Internet Security (CIS) AWS Foundations Benchmark provides a set of security configuration best practices for AWS. Key focus areas:

- **Account Security**
  - Root account controls
  - MFA implementation
  - Password policies
  - Access key rotation

- **Logging & Monitoring**
  - CloudTrail configuration
  - CloudWatch alarm settings
  - Log file validation
  - Multi-region logging

- **Networking**
  - Default VPC security
  - Network ACL configuration
  - Security group management

- **Storage Security**
  - Public access blocking
  - Encryption requirements
  - Versioning configuration

### 3. Payment Card Industry Data Security Standard (PCI DSS) v3.2.1

PCI DSS is a security standard for organizations that handle credit card information. The AWS Security Hub implementation checks for:

- **Network Security**
  - Firewall configurations
  - Secure system configurations
  - Encryption of transmitted data
  - Anti-virus implementation

- **Access Control**
  - Unique user IDs
  - Physical and logical access restrictions
  - System access monitoring
  - Access policy implementation

- **Data Protection**
  - Cardholder data protection
  - Encryption key management
  - Secure transmission of cardholder data
  - Vulnerability management

- **Monitoring & Testing**
  - Resource access tracking
  - Security system testing
  - Security policy maintenance
  - Regular security assessments

## Implementation Details

The Security Monitoring Stack automatically enables these standards through AWS Security Hub. Each standard creates its own subscription and begins evaluating your AWS environment against its requirements.

### Dependency Order

The stack implements the standards in the following order:
1. GuardDuty Detector
2. Security Hub
3. Security Standards (FSBP, CIS, PCI DSS)
4. Service-Linked Role for Security Hub

### Customization

The stack allows customization through the following properties:
- `enableKubernetesAudit`: Enable/disable Kubernetes audit log monitoring
- `enableMalwareProtection`: Enable/disable EBS volume malware scanning
- `findingPublishingFrequency`: Adjust the frequency of security finding publications

## Best Practices

1. **Regular Review**: Monitor Security Hub findings regularly and establish a process for addressing them
2. **Prioritization**: Focus on high-severity findings first, particularly those affecting critical resources
3. **Documentation**: Maintain documentation of exceptions and compensating controls
4. **Automation**: Implement automated remediation for common security findings
5. **Testing**: Regularly test security controls and incident response procedures

## Additional Resources

- [AWS Security Hub Documentation](https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html)
- [Amazon GuardDuty Documentation](https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html)
- [CIS AWS Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services)
- [PCI DSS Standard](https://www.pcisecuritystandards.org/) 