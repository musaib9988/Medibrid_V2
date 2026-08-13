import { doc, deleteDoc } from 'firebase/firestore';
import { db } from './src/firebase.ts';

const deleteDemo = async () => {
  const clinics = ['clinic-1', 'clinic-2'];
  const doctors = ['doc-1', 'doc-2', 'doc-3'];
  const banners = ['ban-1', 'ban-2'];
  
  try {
    for (const id of clinics) await deleteDoc(doc(db, 'clinics', id));
    for (const id of doctors) await deleteDoc(doc(db, 'doctors', id));
    for (const id of banners) await deleteDoc(doc(db, 'banners', id));
    console.log("Demo data deleted successfully!");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

deleteDemo();
