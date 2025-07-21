import { useState } from "react";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthUser } from "@/hooks/useAuthUser";

const SUBJECTS = ["Math", "Biology", "Physics", "Chemistry", "English"];

export default function UploadNote() {
  const { firebaseUser } = useAuthUser();
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    tags: "",
    price: 0,
    isFree: true,
    file: null,
  });
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked, price: checked ? 0 : f.price }));
    } else if (type === "file") {
      setForm((f) => ({ ...f, file: files[0] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firebaseUser || !form.file) return;
    setUploading(true);

    // Upload file to Firebase Storage
    const fileRef = ref(storage, `notes/${firebaseUser.uid}/${Date.now()}_${form.file.name}`);
    await uploadBytes(fileRef, form.file);
    const fileUrl = await getDownloadURL(fileRef);

    // Save metadata to Firestore
    await addDoc(collection(db, "notes"), {
      title: form.title,
      description: form.description,
      subject: form.subject,
      tags: form.tags.split(",").map(t => t.trim()),
      price: form.isFree ? 0 : Number(form.price),
      fileUrl,
      authorId: firebaseUser.uid,
      authorName: firebaseUser.displayName,
      createdAt: serverTimestamp(),
      downloads: 0,
      rating: 0,
      numRatings: 0,
      isVerified: false,
      isEditable: true,
    });

    setUploading(false);
    alert("Note uploaded!");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 bg-white rounded shadow space-y-4">
      <h2 className="text-xl font-bold">Upload Note</h2>
      <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="input w-full border p-2 rounded" required />
      <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="input w-full border p-2 rounded" required />
      <select name="subject" value={form.subject} onChange={handleChange} className="input w-full border p-2 rounded" required>
        <option value="">Select Subject</option>
        {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
      </select>
      <input name="tags" value={form.tags} onChange={handleChange} placeholder="Tags (comma separated)" className="input w-full border p-2 rounded" />
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isFree" checked={form.isFree} onChange={handleChange} />
        Free
      </label>
      {!form.isFree && (
        <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Price (₹)" className="input w-full border p-2 rounded" min={1} />
      )}
      <input name="file" type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleChange} className="input w-full border p-2 rounded" required />
      <button type="submit" className="btn btn-primary w-full bg-blue-600 text-white p-2 rounded" disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</button>
    </form>
  );
} 