import { Stack, StackProps, Fn, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import * as ssm from "aws-cdk-lib/aws-ssm";

interface AppStackProps extends StackProps {
    hostedZone: string;
}

export class CdnStack extends Stack {
  constructor(scope: Construct, id: string, props?: AppStackProps) {
    super(scope, id, props);
    
    const { hostedZone } = props!;

    const assetsBucket = new s3.Bucket(this, "nft-assets-bucket-output", {
        removalPolicy: RemovalPolicy.DESTROY,
    });

    assetsBucket.addCorsRule({
      allowedMethods: [
        s3.HttpMethods.GET,
        s3.HttpMethods.POST,
        s3.HttpMethods.PUT,
      ],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
    })

    new ssm.StringParameter(this, "ssm-bucket-nft-assets", {
      stringValue: assetsBucket.bucketName,
      parameterName: "/platform-nft/bucket-nft-assets",
    });

    const certificateArn = ssm.StringParameter.fromStringParameterName(
      this,
      "ssm-certificate-public-assets",
      "/devops-infra/certificate-public-assets"
    ).stringValue;

    const certificate = Certificate.fromCertificateArn(
      this,
      "Certificate",
      certificateArn
    );

    const domain = 'nft.assets.' + hostedZone;

    const cf = new cloudfront.Distribution(this, "nftAssetsCdnDistribution", {
      defaultBehavior: { 
        origin: new origins.S3Origin(assetsBucket),
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT
      },
      domainNames: [ domain ],
      certificate,
    });

    const publicZone = route53.HostedZone.fromLookup(this, "public-zone", {
      domainName: hostedZone,
      privateZone: false,
    });

    const zone = route53.HostedZone.fromHostedZoneAttributes(
      this, 'nftAssetsHostedZone',
      {
        zoneName: domain,
        hostedZoneId: publicZone.hostedZoneId,
      }
    );

    new route53.ARecord(this, "nftAssetsCDNARecord", {
      zone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cf)),
    });

    new route53.AaaaRecord(this, "nftAssetsAliasRecord", {
      zone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cf)),
    });
  }
}