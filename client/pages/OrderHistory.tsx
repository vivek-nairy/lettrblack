import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuthUser } from "@/hooks/useAuthUser";

export default function OrderHistory() {
  const { firebaseUser } = useAuthUser();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(collection(db, "orders"), where("buyerId", "==", firebaseUser.uid));
    getDocs(q).then((snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [firebaseUser]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">My Purchases</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded shadow p-4">
            <h3 className="font-bold">Note ID: {order.noteId}</h3>
            <p className="text-sm">Price: ₹{order.price}</p>
            <a href={order.downloadUrl} className="btn btn-success" download>
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
} 