import * as assets from 'aws-cdk-lib/aws-ecr-assets';
import { Duration, Fn, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { GithubEcrPipeline } from "../constructs/github-ecr-construct";

export interface PipelineStackProps extends StackProps {
  branch: string;
}

export class NftZksnarkPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: PipelineStackProps) {
    super(scope, id, props);

    const { branch } = props!;

    const bucketName = Fn.importValue("codepipelines-artifact-bucket");
    const bucket = s3.Bucket.fromBucketName(this, "s3-bucket", bucketName);

    const repo = new ecr.Repository(this, 'platformNftRespository', {
      repositoryName: 'platform-nft-zksnark',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    repo.addLifecycleRule({ tagPrefixList: ['prod'], maxImageCount: 60 });
    repo.addLifecycleRule({ maxImageAge: Duration.days(30) });

    new GithubEcrPipeline(this, "zksnark-ecr-platform-nft", {
      ecrRepository: repo,
      githubRepo: "platform-nft-zksnark",
      branchName: branch,
      directoryName: "event-circuit",
      artifactBucket: bucket,
      pipelineName: "zksnark-services-platform-nft",
    });
  }
}