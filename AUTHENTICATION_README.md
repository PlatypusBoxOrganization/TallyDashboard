# Authentication System Documentation

This document outlines the authentication system implemented for the Tally Dashboard application, including user roles, registration flow, and admin features.

## User Roles

1. **Admin**
   - Full access to all features
   - Can activate/deactivate users
   - Can assign subscriptions to users
   - Access to admin dashboard

2. **User**
   - Standard user access
   - Limited to dashboard and assigned features
   - Must be activated by admin before first login

## Authentication Flow

### Registration
1. User signs up with email, password, and name
2. Account is created with `isActive: false` by default
3. Admin receives a WhatsApp notification about the new registration
4. User sees a message to wait for admin approval

### Login
1. User enters email and password
2. System checks if the account is active
3. If inactive:
   - User is redirected to WhatsApp to contact admin
   - Session is terminated
4. If active:
   - User is redirected to dashboard
   - User role is stored in localStorage

### Admin Approval
1. Admin logs in to the admin dashboard
2. Views pending user requests
3. Can:
   - Activate/deactivate users
   - Assign subscriptions
   - View user details

## Setup Instructions

### Prerequisites
- Node.js and npm installed
- Firebase project with Authentication and Firestore enabled
- WhatsApp Business API or a WhatsApp number for notifications

### Configuration
1. Update Firebase configuration in `src/firebaseConfig.js`
2. Set up Firestore security rules (see below)
3. Update WhatsApp number in `src/components/Auth.jsx` (search for `wa.me/`)

### Setting Up Admin User
Run the admin setup script:

```bash
cd src/scripts
node setupAdmin.js
```

Follow the prompts to create an admin user.

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read their own data
    match /users/{userId} {
      allow read, update: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null && request.resource.data.role == 'user' && request.resource.data.isActive == false;
    }
    
    // Admin-only collections
    match /subscriptions/{subscription} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Other collections
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

## Environment Variables

Create a `.env` file in the root directory with:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_WHATSAPP_NUMBER=1234567890
```

## Testing

1. Register a new user account
2. Verify admin receives WhatsApp notification
3. Log in as admin and activate the new user
4. Log in as the new user to verify access
5. Test deactivating the user and verifying access is denied

## Troubleshooting

- **User can't log in after registration**: Check if the account is activated in the admin dashboard
- **Admin can't access dashboard**: Verify the user has the 'admin' role in Firestore
- **WhatsApp notifications not working**: Check the phone number format and internet connection

## Security Notes

- Passwords are hashed by Firebase Authentication
- Sensitive operations require authentication
- Admin routes are protected server-side and client-side
- Session is stored in HTTP-only cookies when possible
- Implement rate limiting on authentication endpoints

For additional security, consider implementing:
- Two-factor authentication
- Email verification
- Password strength requirements
- Suspicious activity monitoring
