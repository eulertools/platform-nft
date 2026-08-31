import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { SecretValue, Stack, StackProps } from "aws-cdk-lib";

interface ConstructProps extends StackProps {
  branch: string;
}

export class CICDPipelineConstruct extends Construct {
  public readonly cicdPipeline: CodePipeline;
  constructor(scope: Stack, id: string, props?: ConstructProps) {
    super(scope, id);

    const { branch } = props!;

    const pipeline = new CodePipeline(this, `cicd-${id}-pipeline`, {
      crossAccountKeys: true,
      pipelineName: `cicd-${id}-pipeline`,
      dockerEnabledForSynth: true,
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub("eulertools/platform-nft", branch, {
          authentication: SecretValue.secretsManager("githubToken"),
        }),
        installCommands: ["npm install -g aws-cdk"],
        commands: [
          'echo "Platform API"',
          'git config --global url."https://".insteadOf ssh://git@',
          "npm ci",
          "npm i typescript",
          "cd src/layers",
          "find . -maxdepth 2 -type d \\( ! -name . \\) -exec bash -c 'cd '{}' && npm install' \\;",
          "cd ../extra/",
          "find . -maxdepth 2 -type d \\( ! -name . \\) -exec bash -c 'cd '{}' && npm install' \\;",
          "cd ../platform-apis-handler/",
          "find . -maxdepth 2 -type d \\( ! -name . \\) -exec bash -c 'cd '{}' && npm install' \\;",
          "cd ../../",
          "npx cdk synth",
        ],
        primaryOutputDirectory: "cdk.out",
      }),
    });

    this.cicdPipeline = pipeline;
  }
}
