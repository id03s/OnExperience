// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 너의 Firebase 프로젝트 설정 (이미 등록된 웹앱에서 복사한 값)
const firebaseConfig = {
  apiKey: "AIzaSyBImpl0wATNdKwYQGucwP8PANLt8e3Hznk",
  authDomain: "blog-experience.firebaseapp.com",
  projectId: "blog-experience",
  storageBucket: "blog-experience.appspot.com",
  messagingSenderId: "323086507307",
  appId: "1:323086507307:web:8dd030fe0dbf8d31a52f90"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore DB 연결
export const db = getFirestore(app);
