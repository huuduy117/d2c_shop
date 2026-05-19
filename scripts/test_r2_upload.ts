import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

(async function main() {
  const { uploadBufferToR2 } = await import("../src/lib/storage/r2");
  const url = await uploadBufferToR2(
    `test-upload-${Date.now()}.txt`,
    Buffer.from("Hello from test script\n"),
    "text/plain",
  );
  console.log("Uploaded to:", url);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
