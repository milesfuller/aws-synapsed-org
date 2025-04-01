import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import { LambdaWebSocketIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { BaseStack, BaseStackProps } from '../interfaces/base-stack';
import { Construct } from 'constructs';

export interface WebAppStackProps extends BaseStackProps {
  domainName: string;
  notesSubdomain: string;
  budgetSubdomain: string;
  securityTeamEmail: string;
}

export class WebAppStack extends BaseStack {
  constructor(scope: Construct, id: string, props: WebAppStackProps) {
    super(scope, id, props);

    // Create S3 buckets for static hosting
    const landingPageBucket = new s3.Bucket(this, 'LandingPageBucket', {
      bucketName: `landing.${props.domainName}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    const notesAppBucket = new s3.Bucket(this, 'NotesAppBucket', {
      bucketName: `${props.notesSubdomain}.${props.domainName}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    const budgetAppBucket = new s3.Bucket(this, 'BudgetAppBucket', {
      bucketName: `${props.budgetSubdomain}.${props.domainName}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Create CloudFront distributions
    const landingPageDistribution = new cloudfront.Distribution(this, 'LandingPageDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(landingPageBucket, {
          originAccessIdentity: new cloudfront.OriginAccessIdentity(this, 'LandingPageOAI'),
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    const notesAppDistribution = new cloudfront.Distribution(this, 'NotesAppDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(notesAppBucket, {
          originAccessIdentity: new cloudfront.OriginAccessIdentity(this, 'NotesAppOAI'),
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    const budgetAppDistribution = new cloudfront.Distribution(this, 'BudgetAppDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(budgetAppBucket, {
          originAccessIdentity: new cloudfront.OriginAccessIdentity(this, 'BudgetAppOAI'),
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Create DynamoDB tables
    const didTable = new dynamodb.Table(this, 'DIDTable', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'did', type: dynamodb.AttributeType.STRING },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
    });

    const syncMetadataTable = new dynamodb.Table(this, 'SyncMetadataTable', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
    });

    // Create WebSocket API
    const connectFunction = new lambda.Function(this, 'ConnectFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/websocket'),
    });

    const disconnectFunction = new lambda.Function(this, 'DisconnectFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/websocket'),
    });

    const defaultFunction = new lambda.Function(this, 'DefaultFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/websocket'),
    });

    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'WebSocketApi', {
      connectRouteOptions: {
        integration: new LambdaWebSocketIntegration({
          handler: connectFunction,
        }),
      },
      disconnectRouteOptions: {
        integration: new LambdaWebSocketIntegration({
          handler: disconnectFunction,
        }),
      },
      defaultRouteOptions: {
        integration: new LambdaWebSocketIntegration({
          handler: defaultFunction,
        }),
      },
    });

    const webSocketStage = new apigatewayv2.WebSocketStage(this, 'WebSocketStage', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    // Create ElastiCache cluster for session management
    const sessionCache = new elasticache.CfnCacheCluster(this, 'SessionCache', {
      cacheNodeType: 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      port: 6379,
      preferredAvailabilityZone: cdk.Stack.of(this).availabilityZones[0],
      vpcSecurityGroupIds: [], // Add security group
      cacheSubnetGroupName: '', // Add subnet group
    });

    // Create WAF rules
    const wafAcl = new wafv2.CfnWebACL(this, 'WebAppWAF', {
      defaultAction: { allow: {} },
      scope: 'CLOUDFRONT',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'WebAppWAFMetric',
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 0,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSetMetric',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // Associate WAF with distributions
    new wafv2.CfnWebACLAssociation(this, 'LandingPageWAFAssociation', {
      resourceArn: landingPageDistribution.distributionArn,
      webAclArn: wafAcl.attrArn,
    });

    new wafv2.CfnWebACLAssociation(this, 'NotesAppWAFAssociation', {
      resourceArn: notesAppDistribution.distributionArn,
      webAclArn: wafAcl.attrArn,
    });

    new wafv2.CfnWebACLAssociation(this, 'BudgetAppWAFAssociation', {
      resourceArn: budgetAppDistribution.distributionArn,
      webAclArn: wafAcl.attrArn,
    });

    // Create DNS records
    const zone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: props.domainName,
    });

    new route53.ARecord(this, 'LandingPageAliasRecord', {
      zone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(landingPageDistribution)
      ),
    });

    new route53.ARecord(this, 'NotesAppAliasRecord', {
      zone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(notesAppDistribution)
      ),
    });

    new route53.ARecord(this, 'BudgetAppAliasRecord', {
      zone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(budgetAppDistribution)
      ),
    });

    // Create ACM certificates
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: props.domainName,
      subjectAlternativeNames: [
        `*.${props.domainName}`,
      ],
      validation: acm.CertificateValidation.fromDns(zone),
    });

    // Create stack outputs
    new cdk.CfnOutput(this, 'LandingPageUrl', {
      value: `https://${landingPageDistribution.distributionDomainName}`,
    });

    new cdk.CfnOutput(this, 'NotesAppUrl', {
      value: `https://${notesAppDistribution.distributionDomainName}`,
    });

    new cdk.CfnOutput(this, 'BudgetAppUrl', {
      value: `https://${budgetAppDistribution.distributionDomainName}`,
    });

    new cdk.CfnOutput(this, 'WebSocketApiUrl', {
      value: webSocketStage.url,
    });
  }
} 