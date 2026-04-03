import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const client = new S3Client({
    region: "eu-central-003",
    endpoint: process.env.STORAGE_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.STORAGE_SECRET_KEY!,
    },
});

const BUCKET = process.env.STORAGE_BUCKET!;

interface UploadFileInput {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    folder: string;
}

export async function uploadFile(input: UploadFileInput): Promise<string> {
    const sanitised = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${input.folder}/${randomUUID()}-${sanitised}`;

    await client.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: input.buffer,
            ContentType: input.mimeType,
        })
    );

    return key;
}

export async function deleteFile(key: string): Promise<void> {
    await client.send(
        new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
    );
}

export async function getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn: expiresInSeconds }
    );
}