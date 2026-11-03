#!/usr/bin/env node
import {
  deployFunction,
  deploySite,
  getOrCreateBucket,
  getFunctions,
} from '@remotion/lambda';
import path from 'path';
import dotenv from 'dotenv';

// Load backend/.env
const root = path.resolve(import.meta.dirname, '..');
dotenv.config({ path: path.join(root, 'backend', '.env') });

const region = process.env.REMOTION_AWS_REGION || process.env.AWS_REGION || 'us-east-1';

console.log('====================================================');
console.log('REMOTION LAMBDA AWS CLOUD DEPLOYMENT');
console.log('====================================================');
console.log(`Target AWS Region: ${region}`);

if (!process.env.REMOTION_AWS_ACCESS_KEY_ID && !process.env.AWS_ACCESS_KEY_ID) {
  console.error('\n[ERROR] Missing AWS credentials!');
  console.error('Please set the following in backend/.env:');
  console.error('  REMOTION_AWS_ACCESS_KEY_ID=your_access_key');
  console.error('  REMOTION_AWS_SECRET_ACCESS_KEY=your_secret_key');
  console.error('  REMOTION_AWS_REGION=us-east-1 (or your preferred region)');
  process.exit(1);
}

// Map REMOTION_AWS_* to standard AWS_* for AWS SDK
if (process.env.REMOTION_AWS_ACCESS_KEY_ID) {
  process.env.AWS_ACCESS_KEY_ID = process.env.REMOTION_AWS_ACCESS_KEY_ID;
}
if (process.env.REMOTION_AWS_SECRET_ACCESS_KEY) {
  process.env.AWS_SECRET_ACCESS_KEY = process.env.REMOTION_AWS_SECRET_ACCESS_KEY;
}

async function main() {
  try {
    console.log('\n1. Checking / Creating S3 storage bucket on AWS...');
    const { bucketName } = await getOrCreateBucket({ region });
    console.log(`   Bucket ready: ${bucketName}`);

    console.log('\n2. Bundling and uploading Remotion site to S3...');
    const entryPoint = path.join(root, 'remotion', 'src', 'index.ts');
    const { serveUrl, siteName } = await deploySite({
      bucketName,
      entryPoint,
      region,
      siteName: 'animation-bittrix',
    });
    console.log(`   Site deployed successfully!`);
    console.log(`   Serve URL: ${serveUrl}`);

    console.log('\n3. Checking / Deploying Remotion Lambda render function...');
    const existingFunctions = await getFunctions({ region, compatibleOnly: true });
    let functionName;

    if (existingFunctions.length > 0) {
      functionName = existingFunctions[0].functionName;
      console.log(`   Using existing compatible Lambda function: ${functionName}`);
    } else {
      console.log('   Creating new Lambda function with Chromium runtime (memory: 3008 MB, disk: 10240 MB)...');
      const deployed = await deployFunction({
        region,
        timeoutInSeconds: 240,
        memorySizeInMb: 3008,
        diskSizeInMb: 10240,
      });
      functionName = deployed.functionName;
      console.log(`   Lambda function deployed: ${functionName}`);
    }

    console.log('\n====================================================');
    console.log('DEPLOYMENT COMPLETE!');
    console.log('Add or verify the following in your backend/.env:');
    console.log('====================================================');
    console.log(`REMOTION_RENDER_MODE=lambda`);
    console.log(`REMOTION_AWS_REGION=${region}`);
    console.log(`REMOTION_LAMBDA_FUNCTION_NAME=${functionName}`);
    console.log(`REMOTION_LAMBDA_SERVE_URL=${serveUrl}`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('\nDeployment failed:', err.message || err);
    process.exit(1);
  }
}

main();
