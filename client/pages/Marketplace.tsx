import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Marketplace() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    getDocs(collection(db, "notes")).then((snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      {notes.map(note => (
        <div key={note.id} className="bg-white rounded shadow p-4 flex flex-col">
          <h3 className="font-bold">{note.title}</h3>
          <p className="text-sm text-gray-500">{note.subject}</p>
          <p className="text-xs">{note.description}</p>
          <div className="flex-1" />
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold">{note.price === 0 ? "Free" : `₹${note.price}`}</span>
            <button className="btn btn-primary">Preview</button>
            <button className="btn btn-success">{note.price === 0 ? "Download" : "Buy Now"}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
