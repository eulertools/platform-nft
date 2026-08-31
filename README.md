# platform-nft

AWS CDK stacks for the NFT marketplace/minting API. Archived snapshot, as-is.

This tree is a **new public commit** with no git history. The original private archive is `eulertools/platform-nft-archive`.

Hosted-zone choice uses `CDK_DEV_ACCOUNT` (`dev.euler.tools` vs `prod.euler.tools`). Generated `cdk.context.json` (hosted-zone ids, AWS account) was **removed**. Paid RPC URLs were replaced with public seeds.

No contract deployments recorded in this repo.

## What was built (EN)

platform-nft is a comprehensive AWS CDK-based NFT platform providing the full NFT marketplace and minting infrastructure. It defines six CDK stacks: `cdn-stack`, `minter-stack` (auto-generates an EVM wallet stored in AWS Secrets Manager), `platform-apis-nft-stack` (the main API stack), `storage-stack`, `validation-nft-stack`, and `zksnark-pipelines-stack`. The main API provisions a Lambda REST API with Cognito authentication covering NFT CRUD, collections, marketplace ads, NFT requests, whitelist requests, and address lookups across BSC, Polygon, and Ethereum. It uses DynamoDB for NFT data, S3 for asset storage, AWS Rekognition for content moderation, Redis/ElastiCache for caching, and a Moralis API key (from SSM, not committed) for blockchain data. The `kinesis-elasticsearch-syncer` Lambda synchronizes DynamoDB changes to OpenSearch for full-text search. The `validation-nft` Lambda processes SQS messages calling Amazon Rekognition to flag inappropriate NFT content. It integrates the `platform-nft-zksnark` service via App Runner for ZK proof verification.

## Qué se construyó (ES)

platform-nft es una plataforma NFT completa basada en AWS CDK que proporciona la infraestructura de marketplace y minting de NFTs. Define seis stacks de CDK: `cdn-stack`, `minter-stack`, `platform-apis-nft-stack`, `storage-stack`, `validation-nft-stack` y `zksnark-pipelines-stack`. Contexto CDK de AWS eliminado.

---

## Notice / Aviso

**Euler Tools ha cerrado. Euler Tools is closed.**

La empresa quebró. Este repositorio está archivado y no se mantiene. El software se ofrece tal cual (as is), sin garantía ni soporte. Parte del material puede ser reclamado por acreedores.

The company went bankrupt. This repository is archived and unmaintained. Software is provided as is, with no warranty and no support. Some material may be claimed by creditors.

Site: https://euler.tools  
Org: https://github.com/eulertools  
Enquiries: https://sinequix.com · https://github.com/tebayoso
