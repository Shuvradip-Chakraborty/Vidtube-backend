# 📁 Project VidTube — Backend API

A Cloudinary-enabled backend for media uploads and user authentication built with **Node.js**, **Express**, and **MongoDB**.  
This service accepts temporary multipart uploads (via `multer`), uploads files to Cloudinary, and cleans up temporary files from `public/temp`.

---

## 📌 Table of Contents
- Overview
- Features
- Tech Stack
- Folder Structure
- Cloudinary & Upload Flow
- Environment Variables
- Setup & Run
- Notes on public/temp
- Future Enhancements
- Author

---

## 🧩 Overview

Project VidTube backend handles secure user flows and media uploads. It is designed to:

- Accept file uploads from clients (images/videos)
- Validate and temporarily store files in `public/temp`
- Upload files to Cloudinary
- Remove temporary files after successful upload
- Provide standardized API responses and error handling

---

## 🚀 Key Features

- User authentication (JWT + refresh token flow — if implemented)  
- Secure file upload using `multer` (multipart/form-data)  
- Cloudinary integration for cloud media storage  
- Temporary file cleanup from `public/temp` after upload  
- Centralized error handling and modular controllers/services

---

## 🛠️ Tech Stack

| Category | Tools |
|---------:|:------|
| Runtime  | Node.js |
| Framework| Express.js |
| Storage  | Cloudinary |
| DB (if used) | MongoDB + Mongoose |
| Upload handling | multer |
| Auth | JWT, bcrypt (if present) |
| Config | dotenv, .env.sample |

---

## 📂 Folder Structure

```text

PROJECT-VIDTUBE/
│
├── public/
│ └── temp/ # Temporary storage before Cloudinary upload
│
├── src/
│ ├── config/ # Cloudinary configuration
│ ├── controllers/ # API controllers (User, Video, Comments, Likes, Playlist)
│ ├── db/ # MongoDB connection
│ ├── middlewares/ # Auth, asyncHandler, error middleware
│ ├── models/ # Mongoose models
│ ├── routes/ # All API routes
│ ├── utils/ # Utilities (Cloudinary upload, API response, etc.)
│ ├── app.js # Express app setup
│ └── index.js # Server entry point
│
├── .env # Environment variables
├── .env.sample # Example env file (fill this — don’t delete)
├── .gitignore
├── package.json
├── package-lock.json
└── README.md

```

---

## ☁️ Cloudinary & Upload Flow

1. Client sends multipart/form-data (file) to the backend upload endpoint.  
2. `multer` saves the uploaded file temporarily to `public/temp`.  
3. Backend validates file type & size, then sends file to Cloudinary via `src/utils/cloudinary.js`.  
4. On success, backend removes the local temp file and returns Cloudinary URL/metadata to client.  
5. On failure, backend removes temp file and returns a descriptive error.

**Important:** `public/temp/` is **temporary storage only**. Files should never remain there.

---

## 🔑 Environment Variables

Create a `.env` from `.env.sample` with real values (never commit `.env`):

```text

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=8000
MONGO_URI=your_mongo_uri # if your project uses a DB
JWT_SECRET=your_jwt_secret # if using JWT

```

---

## ⚙️ Setup & Run

### 1. Clone the repository
```bash
git clone https://github.com/Shuvradip-Chakraborty/Vidtube-backend.git
cd project-vidtube
```


### 2. Install dependencies
```bash
npm install
```


### 3. Create .env file
```bash
- Copy variables from `.env.sample`
- Fill in your actual secret values
```


### 4. Start development server
```bash
npm run dev
```


------------------------------------------------------------

## 🗂 Notes about public/temp

- Keep this folder inside your repo (even if empty).
- Multer writes temporary uploaded files here.
- Add `public/temp/` to `.gitignore` so temp files are never committed.
- After uploading to Cloudinary, your code should delete temporary files  
  (Check `src/utils/cloudinary.js` and the upload controller).


------------------------------------------------------------

## 🔮 Future Enhancements

- Upload progress tracking (WebSockets / SSE)
- Server-side video/image processing (thumbnails, transcoding)
- Direct-to-Cloudinary signed uploads for large files
- Store metadata for search, sorting, recommendations


------------------------------------------------------------

## 👤 Author
**Shuvradip Chakraborty**  
Backend Developer — Node.js | Express | MongoDB | Cloudinary

