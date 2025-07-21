import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuthUser } from "@/hooks/useAuthUser";

export default function SellerDashboard() {
  const { firebaseUser } = useAuthUser();
  const [notes, setNotes] = useState([]);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(collection(db, "notes"), where("authorId", "==", firebaseUser.uid));
    getDocs(q).then((snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    // TODO: Calculate earnings (sum of all paid orders for this seller)
  }, [firebaseUser]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">My Notes</h2>
      <div className="mb-4">Total Earnings: ₹{earnings}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map(note => (
          <div key={note.id} className="bg-white rounded shadow p-4">
            <h3 className="font-bold">{note.title}</h3>
            <p className="text-sm">{note.subject}</p>
            <p className="text-xs">{note.description}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold">{note.price === 0 ? "Free" : `₹${note.price}`}</span>
              <span>Downloads: {note.downloads}</span>
            </div>
            {/* Add edit/delete buttons if note.isEditable */}
          </div>
        ))}
      </div>
    </div>
  );
} 