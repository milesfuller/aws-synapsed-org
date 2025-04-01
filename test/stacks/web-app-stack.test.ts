import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { WebAppStack } from '../../lib/stacks/web-app-stack';

describe('WebAppStack', () => {
  let stack: WebAppStack;
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new WebAppStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environment: 'test',
      projectName: 'test-project',
      domainName: 'synapsed.me',
      notesSubdomain: 'notes',
      budgetSubdomain: 'budget',
      securityTeamEmail: 'security@synapsed.me',
    });
    template = Template.fromStack(stack);
  });

  test('creates S3 buckets for static hosting', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'landing.synapsed.me',
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
        ErrorDocument: 'index.html',
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'notes.synapsed.me',
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
        ErrorDocument: 'index.html',
      },
    });

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'budget.synapsed.me',
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
        ErrorDocument: 'index.html',
      },
    });
  });

  test('creates CloudFront distributions', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultRootObject: 'index.html',
        Enabled: true,
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https',
          TargetOriginId: Match.anyValue(),
        },
        CustomErrorResponses: [
          {
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
          },
        ],
      },
    });
  });

  test('creates DynamoDB tables', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [
        { AttributeName: 'did', KeyType: 'HASH' },
      ],
      SSESpecification: { SSEEnabled: true },
      PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
    });

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ],
      SSESpecification: { SSEEnabled: true },
      PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
    });
  });

  test('creates WebSocket API', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs18.x',
      Handler: 'index.handler',
    });

    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      Name: Match.anyValue(),
      ProtocolType: 'WEBSOCKET',
      RouteSelectionExpression: '$request.body.action',
    });

    template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
      StageName: 'prod',
      AutoDeploy: true,
    });
  });

  test('creates ElastiCache cluster', () => {
    template.hasResourceProperties('AWS::ElastiCache::CacheCluster', {
      CacheNodeType: 'cache.t3.micro',
      Engine: 'redis',
      NumCacheNodes: 1,
      Port: 6379,
    });
  });

  test('creates WAF Web ACL', () => {
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      DefaultAction: { Allow: {} },
      Scope: 'CLOUDFRONT',
      Rules: Match.arrayWith([
        Match.objectLike({
          Name: 'AWS-AWSManagedRulesCommonRuleSet',
          Priority: 0,
          Statement: {
            ManagedRuleGroupStatement: {
              VendorName: 'AWS',
              Name: 'AWSManagedRulesCommonRuleSet',
            },
          },
        }),
      ]),
    });
  });

  test('creates stack outputs', () => {
    template.hasOutput('LandingPageUrl', {
      Value: {
        'Fn::Join': [
          '',
          [
            'https://',
            {
              'Fn::GetAtt': [Match.stringLikeRegexp('LandingPageDistribution'), 'DomainName'],
            },
          ],
        ],
      },
    });

    template.hasOutput('WebSocketApiUrl', {
      Value: {
        'Fn::Join': [
          '',
          [
            'wss://',
            { Ref: Match.stringLikeRegexp('WebSocketApi') },
            '.execute-api.us-east-1.',
            { Ref: 'AWS::URLSuffix' },
            '/prod',
          ],
        ],
      },
    });
  });
}); 