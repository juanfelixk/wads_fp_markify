export async function createLecturerClient(email: string, name: string) {
    const res = await fetch("/api/v1/admin/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
}

export async function fetchAllLecturers() {
    const res = await fetch("/api/v1/admin/lecturer");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
    return data;
}

export async function fetchAllStudents() {
    const res = await fetch("/api/v1/admin/student");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
    return data;
}