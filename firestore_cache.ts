/// responsible mainly for caching students tag, id (student information) and photo so that
/// we'll have our own copy of the data. and we dont have to call the api every time

import firebase from "firebase/compat/app";
import { addDoc, collection, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { firestore } from "./firebase";


export async function storeStudentInfo(id: string, data: any) {

    const coll = collection(firestore, "students");
    const docRef = doc(coll, id);
    try {
        await setDoc(docRef, data);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// in the database we store the student photo as their student id mapped to their base64 image data url
// its collection is separate from the students collection
// collection: student_photos
// this allows us to modify the student photo without modifying the student info
export async function getStudentPhotoFirebase(id: string) {
    // get the document with the id
    const docRef = doc(firestore, "student_photos", id)
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        // get the data
        const data = docSnap.data();
        // get the base64 image data url
        const base64 = data.image_url;
        return base64;
    } else {
        console.log("No such document!");
        return null;
    }
}