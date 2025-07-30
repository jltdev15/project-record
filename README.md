# Document Record Management System

A comprehensive document management system built with React, TypeScript, Firebase, and Tailwind CSS. This system allows administrators to upload, search, and manage documents with QR code integration for easy access.

## Features

- 🔐 **Email/Password Authentication** - Secure login with Firebase Authentication
- 📤 **Document Upload** - Upload PDF, JPG, and PNG files with metadata
- 🔍 **Advanced Search** - Search by title, reference number, description, and document type
- 📱 **QR Code Integration** - Generate QR codes for direct document access
- 📄 **PDF Generation** - Create printable PDFs with metadata and QR codes
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Modern UI** - Clean, intuitive interface with Tailwind CSS

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4.1
- **Authentication**: Firebase Authentication (Email/Password)
- **Database**: Firebase Realtime Database
- **Storage**: Firebase Storage
- **QR Codes**: react-qr-code
- **PDF Generation**: jsPDF + html2canvas

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Authentication, Realtime Database, and Storage enabled

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd project-record
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable the following services:
   - Authentication (Email/Password)
   - Realtime Database
   - Storage

3. Update the Firebase configuration in `src/firebase/config.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 4. Firebase Security Rules

#### Realtime Database Rules
```json
{
  "rules": {
    "documents": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

#### Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

### Authentication
- Use the email/password form to sign in or create an account
- New users can create an admin account by clicking "Need an account? Create one"
- Only authenticated users can access the system

### Uploading Documents
1. Navigate to the "Upload Document" tab
2. Select a PDF, JPG, or PNG file
3. Fill in the required metadata:
   - Title
   - Reference Number
   - Document Type
   - Date
   - Description (optional)
4. Click "Upload Document"
5. Monitor the upload progress

### Searching Documents
1. Navigate to the "Document Library" tab
2. Use the search bar to find documents by:
   - Title
   - Reference number
   - Description
3. Filter by document type using the dropdown
4. Click "Clear Filters" to reset search

### Document Management
- **Preview**: Click the eye icon to view document details and QR code
- **Download**: Click the download icon to download the original file
- **Generate PDF**: Create a printable PDF with metadata and QR code
- **Delete**: Click the trash icon to remove documents

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx   # Main dashboard layout
│   ├── DocumentCard.tsx # Individual document display
│   ├── DocumentList.tsx # Document search and listing
│   ├── DocumentPreview.tsx # Document preview with QR
│   ├── LoginPage.tsx   # Authentication page
│   └── UploadForm.tsx  # Document upload form
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── firebase/           # Firebase configuration
│   └── config.ts       # Firebase setup
├── services/           # Business logic
│   └── documentService.ts # Document operations
├── types/              # TypeScript interfaces
│   └── index.ts        # Type definitions
├── App.tsx             # Main application component
└── main.tsx           # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Features in Detail

### QR Code Integration
- Each document generates a QR code linking to its Firebase Storage URL
- QR codes are embedded in generated PDFs for easy access
- High-quality QR codes with error correction

### PDF Generation
- Creates printable PDFs with document metadata
- Includes embedded QR code for direct access
- Professional layout suitable for archiving

### Real-time Upload Progress
- Visual progress indicator during file uploads
- Error handling and user feedback
- File size and type validation

### Responsive Design
- Mobile-first approach
- Optimized for desktop and tablet use
- Clean, modern interface

## Security Features

- Email/Password authentication
- Firebase security rules
- File type validation
- User-based access control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.
