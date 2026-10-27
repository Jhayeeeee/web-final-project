# Smart Campus Lost and Found Portal
### *Web Development Final Project — System Walkthrough & Developer POV*

> **Developer:** Jan Ezekiel Villamor  
> **Institution:** Pamantasan ng Lungsod ng Maynila (PLM)  
> **Course/Project:** Web Development Final Project  
> **Stack:** Node.js, Express.js, MongoDB (Mongoose), Multer, Vanilla JS, Tailwind CSS  

---

## 💡 Project Background & Motivation (My POV)

As a university student, I noticed a recurring problem across our campus: students frequently lose valuable belongings—student IDs, earphones, calculators, tumblers, and wallets. Usually, people post about lost or found items across scattered Facebook groups, private group chats, or freedom walls, where posts easily get buried and lost in the feed. There was no single, organized, campus-wide source of truth.

I built this **Smart Campus Lost and Found Web Portal** as my final project to solve that exact problem. 

My goal was to create a full-stack, responsive platform where students can:
1. Immediately report lost or found items with photos and descriptions.
2. Tag the exact campus building, room, and even GPS coordinates using geolocation.
3. Search and filter through active reports in real time.
4. Contact the finder or owner directly with one click via Gmail.
5. Provide campus administrators with a dedicated dashboard to catalog surrendered items and mark resolved claims.

---

##  How I Architected the System

When designing this application, I opted for a lightweight yet robust full-stack architecture:

```
[ Frontend: HTML5 / Tailwind CSS / Vanilla JS ]
                    │
                    ▼  (Fetch API / JSON & Multipart Forms)
[ Backend: Node.js & Express.js REST API (server.js) ]
         ├── Multer Middleware (Local Image Storage in /public/uploads)
         ├── bcrypt (Password Hashing & Security)
         └── Mongoose ODM (Data Modeling & Queries)
                    │
                    ▼
[ Database: MongoDB Atlas (Cloud Database) ]
```

### Why I Chose This Tech Stack:
- **Node.js & Express.js**: I chose Node and Express for the backend because they allow me to build clean, asynchronous REST API endpoints quickly while keeping the entire project in JavaScript.
- **MongoDB & Mongoose**: Since lost and found items can have optional fields (like GPS coordinates, image URLs, room details), a NoSQL document database offered the schema flexibility I needed.
- **Multer**: For storing photo uploads on the server disk (`public/uploads/`) with unique timestamps to prevent duplicate file overwrites.
- **Tailwind CSS (via CDN) & Glassmorphism UI**: I wanted the UI to feel modern, sleek, and premium right out of the box without the heavy build step of complex frontend frameworks.
- **Vanilla JavaScript**: Writing the frontend logic in modular Vanilla JS (`feed.js`, `admin.js`, `my-claims.js`, `auth.js`) gave me full control over DOM manipulation, event listeners, and API fetch calls.

---

## Core Features & How I Built Them

Here is an explanation of the key modules I developed and how they work under the hood:

### 1. User Authentication & Campus Security
- **Domain Restriction**: In `server.js`, I added validation to ensure only official university emails (e.g., ending with `@university.edu.ph`) can register. This keeps the portal exclusive and accountable to campus students.
- **Password Security**: Passwords are never saved in plain text. I used `bcrypt` with a salt factor of 10 to hash passwords during registration and verify them during login.
- **Role-Based Access**: Each user has a `role` (`student` or `admin`). Regular students can report items and browse the feed, while users with the `admin` role get access to the administrative inventory management dashboard.

### 2. Smart Campus Location Tagging & GPS Pinning
In the item report modal (`feed.js` and `feed.html`):
- **Cascading Dropdowns**: I mapped out specific PLM campus structures (such as *Gusaling Corazon Aquino (GCA)*, *Gusaling Villegas (GV)*, *University Library*, and *Campus Grounds*). When a user picks a building, the second dropdown dynamically populates with the rooms/areas belonging to that specific building.
- **HTML5 Geolocation API**: I added a *"Pin Current Location"* button that requests the user's browser GPS coordinates (`navigator.geolocation.getCurrentPosition`). It automatically fills the latitude and longitude fields.
- **Google Maps Integration**: When viewing an item card, if GPS coordinates exist, the modal renders a clickable link that opens the exact location directly on Google Maps (`https://www.google.com/maps?q=lat,lng`).

### 3. Image Uploads with Multer
- In `server.js`, I configured `multer.diskStorage` to save uploaded item photos to `public/uploads/`.
- Every uploaded file is assigned a unique name using `Date.now() + path.extname(file.originalname)` to prevent files with the same name from colliding.
- The resulting URL path is stored in the MongoDB item document and served statically.

### 4. Interactive Feed with Instant Client-Side Filters
- All items are fetched from `/api/items` and kept in memory on `feed.js`.
- I added real-time filtering so users don't have to reload the page:
  - **Live search bar**: Matches against both item title and description.
  - **Category filter**: Electronics, IDs & Cards, Bags, Documents, Personal Accessories, etc.
  - **Status filter radio buttons**: View "All", only "Lost", or only "Found".

### 5. Direct Finder/Owner Communication
- Rather than building a slow internal chat, I integrated a direct Gmail trigger.
- When a student clicks **"Contact Finder"** or **"Contact Owner"**, the system generates an encoded `mail.google.com` link pre-populated with the recipient's university email, a clear subject line, and a polite template message.

### 6. Personal Claims & Reports Tracker (`my-claims.html`)
- Students can visit the **My Claims** page to see an isolated list of items that *they* personally reported.
- It compares the logged-in user's ID against `item.reportedBy` so students can track the status of their own belongings.

### 7. Admin Dashboard & Inventory Management (`admin.html`)
- Protected route: non-admin users attempting to open `admin.html` are alerted and redirected back to `index.html`.
- **Live Statistics Cards**: Shows total items, items currently surrendered to the admin office, and successfully claimed items.
- **Status Transitions**: Admins can update item status to `surrendered` (turned over to the Lost & Found office) or `claimed` (returned to the rightful owner).
- **Deletion**: Admins can remove resolved or spam items permanently.

---

## 🗄️ Database Schemas (Data Design)

### 1. `User` Schema (`models/user.js`)
```javascript
{
  fullName: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed with bcrypt
  role:     { type: String, enum: ['student', 'admin'], default: 'student' },
  timestamps: true
}
```

### 2. `Item` Schema (`models/item.js`)
```javascript
{
  itemName:     { type: String, required: true },
  description:  { type: String, required: true },
  category:     { type: String, required: true },
  status:       { type: String, enum: ['lost', 'found', 'claimed', 'surrendered'], required: true },
  location:     { type: String, required: true },
  incidentDate: { type: String, required: true },
  reportedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageURL:     { type: String },
  latitude:     { type: Number },
  longitude:    { type: Number },
  dateReported: { type: Date, default: Date.now }
}
```

---
## 🧪 Testing Guide (How to Try All Roles)

### Testing as a Student:
1. Go to `http://localhost:3000/register.html`.
2. Register an account using an email ending in `@university.edu.ph` (e.g. `student@university.edu.ph`).
3. Log in at `index.html`. You will be directed to `feed.html`.
4. Click **"Report Item"**, upload a picture, select a campus building/room, pin your location, and submit.
5. Search and filter your new item on the feed.
6. Check `my-claims.html` to see your personal reported item list.

### Testing as an Admin:
1. Register an account as usual.
2. In your MongoDB database (via MongoDB Atlas dashboard or MongoDB Compass), open the `users` collection.
3. Find your user document and update the `role` field from `"student"` to `"admin"`:
   ```json
   {
     "role": "admin"
   }
   ```
4. Re-login or navigate to `http://localhost:3000/admin.html`.
5. You will now have access to the Admin Dashboard to change item statuses to `surrendered` or `claimed`, or delete items.

---

## 📂 Project Directory Structure

```text
web-final-project/
├── models/
│   ├── item.js            # Mongoose item schema definition
│   └── user.js            # Mongoose user schema & role definition
├── public/                # Client-facing web pages and assets
│   ├── index.html         # Login portal with university email styling
│   ├── register.html      # Registration portal
│   ├── feed.html          # Lost and Found community feed & report modal
│   ├── feed.js            # Client logic for feed, filters, geolocation & modal
│   ├── my-claims.html     # User's personal reported items page
│   ├── my-claims.js       # Logic filtering items reported by the current user
│   ├── admin.html         # Admin inventory & status control dashboard
│   ├── admin.js           # Admin table, statistics, status update & delete logic
│   ├── auth.js            # Client-side helper functions for session & logout
│   └── uploads/           # Server directory where uploaded item images reside
├── .env                   # Environment secrets (MongoDB URI & PORT) - gitignored
├── .env.example           # Template for environment configuration
├── .gitignore             # Git ignore file protecting node_modules & .env
├── package.json           # Dependencies and project start script
├── server.js              # Express app, Multer config, REST API routes
└── README.MD              # System walkthrough & Developer POV (this file)
```

---

## Future Enhancements (What I Plan to Add Next)

If I continue expanding this system beyond this course project, here are the top features I want to integrate:
- **Interactive Campus Map**: Replace static coordinate links with an interactive Leaflet/Mapbox canvas showing pins across the PLM campus in real time.
- **Automated Email Notifications**: Use `Nodemailer` to send instant email alerts to an owner whenever an item matching their description is posted.
- **QR Code Claim Slips**: Generate unique QR codes for items surrendered to the Admin office to streamline verification when students come to claim them.

---

*Thank you for taking the time to review my final project! Feel free to explore the code or submit an issue/pull request if you have suggestions.*
