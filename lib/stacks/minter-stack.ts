import { Stack, StackProps, aws_secretsmanager, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";

const Wallet = require('ethereumjs-wallet');

export class MinterStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const wallet = Wallet.default.generate();

    new aws_secretsmanager.Secret(this, `evm-wallet-minter-credentials`, {
      secretName: 'evmMinterNft',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          address: wallet.getAddressString(),
          privateKey: wallet.getPrivateKeyString(),
        }),
        generateStringKey: 'tmp'
      }
    });

    new CfnOutput(this, 'minter-nft-address', {
      value: wallet.getAddressString(),
      exportName: 'minter-nft-address',
    });
  }
}