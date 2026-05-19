import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKey = process.env.R2_ACCESS_KEY_ID;
const secretKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL; // optional

if (!accountId || !accessKey || !secretKey || !bucket) {
  // Will throw at runtime if used without proper envs
}

const endpoint = accountId
  ? `https://${accountId}.r2.cloudflarestorage.com`
  : undefined;

const s3 = new S3Client({
  endpoint,
  region: "auto",
  credentials: {
    accessKeyId: accessKey ?? "",
    secretAccessKey: secretKey ?? "",
  },
  forcePathStyle: false,
});

export async function uploadBufferToR2(
  key: string,
  buffer: Buffer,
  contentType = "application/octet-stream",
) {
  if (!bucket) throw new Error("R2_BUCKET_NAME not configured");

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3.send(cmd);

  if (publicUrl) {
    // publicUrl expected like https://<bucket>.<something>.r2.dev or custom CDN
    return `${publicUrl.replace(/\/$/, "")}/${encodeURIComponent(key)}`;
  }

  if (endpoint) return `${endpoint}/${bucket}/${encodeURIComponent(key)}`;

  return `/${encodeURIComponent(key)}`;
}

export default s3;
