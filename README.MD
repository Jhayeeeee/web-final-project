# Smart Campus Lost and Found Portal

**Project Title:** Smart Campus Lost and Found Portal

**GitHub Repository:** [https://github.com/Jhayeeeee/web-final-project](https://github.com/Jhayeeeee/web-final-project)

**Live Application:** [https://lostfound-api-n29y.onrender.com](https://lostfound-api-n29y.onrender.com)

---

## Technology Stack

| Category | Technologies |
|---|---|
| **Frontend** | HTML5, Tailwind CSS (CDN), Vanilla JavaScript |
| **Backend** | Node.js, Express.js, Multer, bcrypt, JSON Web Token (JWT) |
| **Database** | MongoDB Atlas with Mongoose |
| **API** | RESTful API under `/api`, Cloudinary (image storage), Google Maps and Gmail (external links) |
| **Modern/Edge Features** | Render (cloud hosting), Cloudinary CDN, GitHub continuous deployment, JWT stateless authentication, Geolocation API, UptimeRobot monitoring |

---

## Admin Account

| Field | Value |
|---|---|
| **Username** | `[admin email]` |
| **Password** | `[admin password]` |

> Admin accounts are not created through the registration page. Register a normal account, then set its `role` to `"admin"` in MongoDB Atlas.

---

## Overview

Lost items on campus are often posted across scattered Facebook groups and freedom walls, where posts get buried quickly. This portal gives students one organized place to report lost and found items, search the active feed, contact the other party, and track their own posts. Campus admins get a dashboard to manage surrendered items, review reported posts, and manage accounts.

---

## Features

### Student Features

| Feature | Description |
|---|---|
| Account | Register and log in with a university email (`@university.edu.ph`) |
| Report item | Report a lost or found item with a photo, description, category, date, and campus location |
| GPS location | Auto-detect GPS location and link it to Google Maps |
| Search and filter | Search the public feed by text, category, and status (All, Lost, Found) |
| Contact | Contact the owner or finder through a prepared Gmail message |
| Report spam | Report spam or inappropriate posts |
| My Claims | Manage own posts: mark as found, mark as returned, surrender to admin, or delete |
| Surrender | Surrender a found item to the admin office |
| Notifications | View and clear in-app notifications (bell icon) |
| Account Settings | Change password and view account information |

### Admin Features

| Feature | Description |
|---|---|
| Dashboard | Item statistics: total, at admin office, claimed |
| Inventory | Filter and search all items by status |
| Claim | Mark surrendered items as claimed after the owner collects them |
| Delete | Delete any post |
| Post Management | Review reported posts, dismiss reports, ban or unban accounts |
| Ban behavior | Banning deletes that user's posts and blocks login and API access immediately |
| Banned Accounts | List of banned users with an unban option |
| Broadcast | Send a notification to all students |
| Export | Export the inventory as a CSV report |

---

## System Architecture

| Component | Location | Responsibility |
|---|---|---|
| Browser (Client) | User's device | Runs HTML, Tailwind, and Vanilla JS. Stores token and user in localStorage |
| Render (Web Service) | Render | Runs Express `server.js`. Serves `public/` files, REST API under `/api`, JWT auth, role checks, multer uploads |
| MongoDB Atlas | Cloud | Stores `users`, `items`, and `notifications` |
| Cloudinary | Cloud | Stores item images. Returns a `secure_url` saved in the database |

The browser never talks to MongoDB or Cloudinary directly. Only the Render server does. Images are uploaded to Cloudinary, and only the returned URL is stored in the database.

---

## Access Control (RBAC)

| Role | How it is set | Access |
|---|---|---|
| `user` (student) | Default on registration | Own posts, feed, reports, notifications, settings |
| `admin` | Set manually in MongoDB Atlas | Everything above, plus inventory, post management, bans, broadcast |

The server enforces roles in every protected route. The role is stored in the JWT at login, so a role change takes effect after logging out and back in. The frontend also redirects users based on role, but the server check is the real protection.

| Rule | Who can do it |
|---|---|
| Update or delete a post | Owner (limited status changes) or admin (any post) |

---

## Database Design

### User (`models/user.js`)

| Field | Type | Notes |
|---|---|---|
| fullName | String | Required |
| email | String | Required, unique, must end with `@university.edu.ph` |
| password | String | bcrypt hash |
| role | String | `user` or `admin` |
| isBanned | Boolean | Blocks login and API access when true |

### Item (`models/item.js`)

| Field | Type | Notes |
|---|---|---|
| itemName, description | String | Required |
| category | String | Electronics, IDs & Cards, Bags, Others |
| status | String | `lost`, `found`, `surrendered`, `claimed` |
| location | String | Building and room, or "GPS Location Tagged" |
| incidentDate | String | Date of loss or finding |
| reportedBy | ObjectId | Reference to User |
| imageURL | String | Cloudinary `secure_url` |
| latitude, longitude | Number | Optional GPS |
| reportCount, reportedByUsers | Number, Array | Spam reports |
| dateReported | Date | Default: now |

### Notification (`models/notification.js`)

| Field | Type | Notes |
|---|---|---|
| recipient | ObjectId | Reference to User |
| type | String | `item_claimed` or `admin_broadcast` |
| title, message | String | Content |
| item | ObjectId | Optional reference to Item |
| isRead | Boolean | Read state |

---

## Item Status Flow

| From | To | Who | Meaning |
|---|---|---|---|
| lost | claimed | Owner | Owner found it, closes the post |
| found | claimed | Owner | Owner got the item back |
| found | surrendered | Owner (finder) | Finder gives the item to the admin office |
| surrendered | claimed | Admin | Owner collected the item from the admin office |

Only admins can set `claimed` on a surrendered item.

---

## API Overview

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/register` | Public | Create student account |
| POST | `/api/login` | Public | Log in and receive token |
| PUT | `/api/users/change-password` | Logged in | Change own password |
| GET | `/api/users` | Admin | List non-admin accounts |
| PUT | `/api/users/:id/ban` | Admin | Ban or unban (toggle) |
| GET | `/api/items` | Public | List all items |
| POST | `/api/items` | Logged in | Report item with optional image |
| DELETE | `/api/items/:id` | Owner or admin | Delete post |
| PUT | `/api/items/:id/status` | Owner (limited) or admin | Update status |
| POST | `/api/items/:id/report` | Logged in | Report a post as spam |
| PUT | `/api/items/:id/dismiss-report` | Admin | Clear reports |
| GET | `/api/notifications` | Logged in | Get own notifications |
| PUT | `/api/notifications/:id/read` | Logged in | Mark one as read |
| PUT | `/api/notifications/read-all` | Logged in | Mark all as read |
| DELETE | `/api/notifications/:id` | Logged in | Delete one notification |
| DELETE | `/api/notifications` | Logged in | Clear all own notifications |
| POST | `/api/admin/notifications/broadcast` | Admin | Notify all students |
| GET | `/api/test` | Public | Health check (used by UptimeRobot) |

---

## Project Structure

| File | Purpose |
|---|---|
| `models/user.js` | User schema (role, isBanned) |
| `models/item.js` | Item schema (status, imageURL, GPS) |
| `models/notification.js` | Notification schema |
| `public/config.js` | `API_BASE` and `imgSrc()` helper |
| `public/index.html` | Login page |
| `public/register.html` | Registration page |
| `public/auth.js` | Login and registration logic |
| `public/feed.html` / `feed.js` | Public feed, report form, contact |
| `public/my-claims.html` / `my-claims.js` | Own posts and status actions |
| `public/profile.html` / `profile.js` | Account settings and password change |
| `public/admin.html` / `admin.js` | Inventory dashboard |
| `public/admin-reports.html` / `admin-report.js` | Post management |
| `public/admin-notify.html` / `admin-notify.js` | Broadcast notification |
| `public/admin-banned.html` / `admin-banned.js` | Banned accounts |
| `public/admin-nav.js` | Admin navbar mobile menu |
| `public/notifications.js` | Bell dropdown (student) |
| `server.js` | Express app, routes, Cloudinary upload |
| `package.json` | Dependencies and scripts |
| `.env.example` | Template for environment variables |
| `.gitignore` | Excludes `node_modules` and `.env` |

---

## Environment Variables

Create a `.env` file for local development. On Render, set the same keys under **Environment**.

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string, including `/LostAndFoundDB` |
| `JWT_SECRET` | Long random string used to sign tokens |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `PORT` | Server port (default `3000`) |

Never commit `.env` or paste secrets in code, screenshots, or chat.

---

## Running Locally

| Step | Command |
|---|---|
| Install dependencies | `npm install` |
| Start the server | `node server.js` |
| Open the app | `http://localhost:3000/index.html` |

---

## Testing Guide

### As a Student

| Step | Action |
|---|---|
| 1 | Register with an `@university.edu.ph` email |
| 2 | Log in. You are redirected to the feed |
| 3 | Report an item with a photo, building, and room. Optionally pin your GPS location |
| 4 | Check that the item appears in the feed and in My Claims |
| 5 | Open another account and try Claim Item or Contact Owner |

### As an Admin

| Step | Action |
|---|---|
| 1 | Register an account normally |
| 2 | In MongoDB Atlas, open `users`, find the account, and set `role` to `"admin"` |
| 3 | Log out and log in again, since the role is read from the token at login |
| 4 | Check the Inventory, Post Management, Banned Accounts, and Notifications pages |

---

## Deployment

| Step | Action |
|---|---|
| 1 | Push the repository to GitHub |
| 2 | On Render, create a Web Service from the repo |
| 3 | Set Build Command to `npm install` and Start Command to `node server.js` |
| 4 | Add the environment variables listed above |
| 5 | Optional: create an UptimeRobot monitor for `https://<your-service>.onrender.com/api/test` with a 5-minute interval |

Every push to `main` redeploys automatically.

---

## Known Limitations

| Limitation | Details |
|---|---|
| Free tier sleep | Render's free plan spins down after inactivity, so the first request can take up to a minute |
| Password policy | Server requires at least 6 characters. No stronger rule |
| Email verification | Registration accepts any `@university.edu.ph` address without confirming ownership |

---

## Future Enhancements

| Enhancement | Description |
|---|---|
| Campus map | Interactive map (Leaflet or Mapbox) with item pins |
| Email notifications | Nodemailer alerts when a matching item is posted |
| QR claim slips | QR codes for items surrendered to the admin office |

---

*Developed by Jan Ezekiel Villamor as a Web Development final project.*