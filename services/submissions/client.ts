import type { UploadResult } from "./types";

// use xhr instead of fetch to show upload progress bar
export async function uploadSubmission(classId: string, assignmentId: string, file: File, onProgress?: (percent: number) => void): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/v1/classes/${classId}/assignments/${assignmentId}/submit`);

        if (onProgress) {
            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
            });
        }

        xhr.addEventListener("load", () => {
            if (xhr.status === 201) {
                resolve(JSON.parse(xhr.responseText) as UploadResult);
            } else {
                const body = JSON.parse(xhr.responseText ?? "{}");
                reject(new Error(body.error ?? "Upload failed"));
            }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        xhr.send(formData);
    });
}

export async function fetchSubmissionFileUrl(classId: string, assignmentId: string): Promise<string> {
    const res = await fetch(`/api/v1/classes/${classId}/assignments/${assignmentId}/file`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch file URL");
    return json.url;
}