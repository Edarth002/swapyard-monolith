"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface Category {
  id: string;
  name: string;
}

const createIdempotencyKey = () => {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  return Array.from(
    bytes,
    b => b.toString(16).padStart(2,"0")
  ).join("");
};

export const nigeriaStates = [
 "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi",
 "Bayelsa","Benue","Borno","Cross River","Delta",
 "Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe",
 "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi",
 "Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun",
 "Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
 "Taraba","Yobe","Zamfara"
];

export function usePostListing() {
 const router = useRouter();
 const fileInputRef = useRef<HTMLInputElement>(null);

 const [name,setName] = useState("");
 const [description,setDescription] = useState("");
 const [price,setPrice] = useState("");
 const [condition,setCondition] = useState("");
 const [stateLocation,setStateLocation] = useState("");
 const [town,setTown] = useState("");
 const [isNegotiable,setIsNegotiable] = useState(false);

 const [categories,setCategories] = useState<Category[]>([]);
 const [categoryId,setCategoryId] = useState("");

 const [deliveryOption,setDeliveryOption] =
 useState<""|"PICKUP"|"DELIVERY">("");

 const [contact,setContact] = useState("");

 const [images,setImages] = useState<File[]>([]);

 const [isSubmitting,setIsSubmitting] = useState(false);
 const [error,setError] = useState("");
 const [showSuccessModal,setShowSuccessModal] =
 useState(false);

 const idempotencyKeyRef =
 useRef(createIdempotencyKey());

 const rotateIdempotencyKey = useCallback(()=>{
   idempotencyKeyRef.current =
   createIdempotencyKey();
 },[]);


useEffect(() => {

 async function fetchCategories() {

   try {

     const res = await fetch(
       "/api/category",
       { cache:"no-store" }
     );

     const data = await res.json();

     if (!res.ok) return;

     const raw = Array.isArray(data)
       ? data
       : data.categories ||
         data.items ||
         data.data ||
         [];

     const normalized = raw
       .map((item:any)=>({
          id:
            item.id ||
            item._id ||
            item.documentId,

          name:
            item.name ||
            item.title
       }))
       .filter(
         (item:Category)=>
           item.id && item.name
       );

      setCategories(normalized);

   } catch (error) {
      console.error(
        "Failed loading categories:",
        error
      );

      setCategories([]);
   }

 }

 fetchCategories();

}, []);


 const handleImageChange = (
   e:React.ChangeEvent<HTMLInputElement>
 ) => {

 if(!e.target.files) return;

 const selectedFiles =
 Array.from(e.target.files);

 const combined = [
  ...images,
  ...selectedFiles
 ].slice(0,6);

 setImages(combined);
};


const removeImage = (
 index:number
)=>{
 setImages(
   images.filter(
    (_,i)=>i !== index
   )
 );
};


const resetForm = ()=>{

 setName("");
 setDescription("");
 setPrice("");
 setCondition("");
 setStateLocation("");
 setTown("");
 setIsNegotiable(false);
 setCategoryId("");
 setDeliveryOption("");
 setContact("");
 setImages([]);
 setShowSuccessModal(false);

 window.scrollTo({
  top:0,
  behavior:"smooth"
 });

};


const handleSubmit = async(
 e:React.FormEvent
)=>{
e.preventDefault();

if(isSubmitting) return;

setError("");

if(
 !name ||
 !description ||
 !price ||
 !condition ||
 !categoryId
){
 setError(
 "Please fill all required fields."
 );
 return;
}

try{

setIsSubmitting(true);

const formData = new FormData();

formData.append("name",name);
formData.append("description",description);

formData.append(
 "price",
 String(Number(price))
);

formData.append(
 "condition",
 condition
);

formData.append(
 "categoryId",
 categoryId
);

formData.append(
 "negotiable",
 String(isNegotiable)
);

formData.append(
 "offersDelivery",
 String(
  deliveryOption==="DELIVERY"
 )
);

if(stateLocation){
 formData.append(
  "state",
  stateLocation
 );
}

if(town){
 formData.append(
  "location",
  town
 );
}

if(contact){
 formData.append(
   "contact",
   contact
 );
}

images.forEach(image=>{
 formData.append(
  "images",
  image
 );
});


const res = await fetch(
 "/api/listing",
 {
  method:"POST",
  headers:{
   "Idempotency-Key":
   idempotencyKeyRef.current
  },
  body:formData
 }
);

const data = await res.json();

if(!res.ok){

 if(data.errors){

const firstError =
 Object.values(
   data.errors
 )
 .flat()[0];

throw new Error(
 firstError
 ? String(firstError)
 : "Validation failed"
);

}

throw new Error(
 data.message ||
 "Failed to post listing"
);

}

setShowSuccessModal(true);

}catch(err:any){

 setError(
  err?.message ||
  "Something went wrong"
 );

}finally{

 rotateIdempotencyKey();
 setIsSubmitting(false);

}

};


return {

state:{
 name,
 description,
 price,
 condition,
 stateLocation,
 town,
 isNegotiable,
 categoryId,
 categories,
 deliveryOption,
 contact,
 images,
 isSubmitting,
 error,
 showSuccessModal,
 nigeriaStates
},

setters:{
 setName,
 setDescription,
 setPrice,
 setCondition,
 setStateLocation,
 setTown,
 setIsNegotiable,
 setCategoryId,
 setDeliveryOption,
 setContact,
 setShowSuccessModal
},

refs:{
 fileInputRef
},

handlers:{
 handleImageChange,
 removeImage,
 resetForm,
 handleSubmit,
 router
}

};

}