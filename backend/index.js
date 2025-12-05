import express from "express";
import cors from "cors";
import * as dotenv from 'dotenv';
import admin from 'firebase-admin'; // Firebase Admin SDK
import path from 'path'; // Node.js native module for path resolution
import { fileURLToPath } from 'url'; // For path resolution in ES Modules
import { Storage } from '@google-cloud/storage'; // Google Cloud Storage SDK
import multer from 'multer'; // Middleware for handling file uploads
import { GoogleAuth } from 'google-auth-library'; // Google Auth Library
import axios from 'axios'; //HTTP Client
import nodemailer from 'nodemailer'; // Nodemailer for email sending

// Load environment variables immediately
dotenv.config();

// --- FIREBASE INITIALIZATION ---

// Helper function to get the current file directory in ES Modules
//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

// Get paths and project ID from environment variables
//const serviceAccountPath = process.env.FIREBASE_PRIVATE_KEY_PATH;
// 1. Get and process the private key from environment variables
// IMPORTANT: Replace '\\n' with actual newline characters '\n'
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

// 2. Construct the in-memory Service Account Credentials Object
const serviceAccountConfig = {
    type: process.env.FIREBASE_TYPE || 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: privateKey, 
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    // Add other fields if necessary, but the above are the core required fields.
};

if (!serviceAccountConfig.project_id || !privateKey) {
    console.error("❌ FATAL: Missing Firebase environment variables. Check .env file.");
    process.exit(1);
}

/*// Resolve the absolute path to the JSON key file
const absolutePath = path.resolve(__dirname, serviceAccountPath); 
console.log(`DEBUG PATH: Resolved Service Account Key Path: ${absolutePath}`);
*/
try {
    // Initialize Firebase Admin SDK
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountConfig), 
        databaseURL: `https://${serviceAccountConfig.project_id}.firebaseio.com` 
    });

    console.log("✅ SUCCESS: Firebase Admin SDK initialized and connected.");
} catch (error) {
    console.error("❌ FATAL: Firebase Initialization Failed!", error.message);
    process.exit(1);
}

// Exported services (Firestore and Auth)
export const db = admin.firestore();
export const auth = admin.auth();

const projectId = serviceAccountConfig.project_id;

// --- GOOGLE CLOUD STORAGE SETUP ---
// Initialize Google Cloud Storage using the same credentials from Firebase Admin SDK
const storage = new Storage({
    projectId: serviceAccountConfig.project_id,
    credentials: serviceAccountConfig, // Re-use the service account key path
});

// Define the bucket name
const bucketName = `${serviceAccountConfig.project_id}.firebasestorage.app`;
const bucket = storage.bucket(bucketName);


// --- MULTER SETUP (Handles file upload from frontend) ---
// We use memory storage so the file is stored temporarily in RAM before being uploaded to GCS.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // Limit files to 5MB (Good practice for performance/cost)
    },
});


// --- EXPRESS SERVER SETUP ---

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = [
    'http://localhost:3000', // For local testing
    'https://lostnfound-phi.vercel.app', // Your production frontend URL
    // Add your preview/branch deployment domain here
];
// Middleware
app.use(express.json()); // Essential for handling JSON data
app.use(cors({
    origin: allowedOrigins,
    credentials: true // Crucial if passing cookies or authorization headers
}));         // Essential for frontend communication


// --- AUTHENTICATION ---

const verifyToken = async (req, res, next) => {
    // 1. Get the token from the Authorization header (e.g., 'Bearer <token>')
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Authorization required.' });
    }

    const idToken = header.split('Bearer ')[1];

    try {
        // 2. Verify the token using Firebase Admin SDK
        // This confirms the token is valid, hasn't expired, and was issued by Firebase.
        const decodedToken = await auth.verifyIdToken(idToken);
        
        // 3. Attach the user object (UID and Custom Claims like 'role') to the request
        req.user = decodedToken; 
        
        next(); // Proceed to the route handler

    } catch (error) {
        console.error("Token Verification Error:", error.message);
        return res.status(401).json({ message: 'Invalid or expired authentication token.' });
    }
};

const authClient = new GoogleAuth({ 
    credentials: serviceAccountConfig, // <--- 1. Tells it WHICH file to use
    scopes: ['https://www.googleapis.com/auth/cloud-platform'], // <--- 2. Tells it WHAT permissions to ask for
});

// --- NODEMAILER SETUP ---
// NOTE: Replace YOUR_EMAIL and YOUR_APP_PASSWORD with actual credentials.
// For security, get an App Password from your email provider (like Gmail).
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider's service name
    auth: {
        user: process.env.EMAIL_USER, // Store in your .env file (Gmail Address)
        pass: process.env.EMAIL_PASS  // Store in your .env file (App Password)
    }
});
console.log("✅ SUCCESS: Nodemailer transporter initialized.");

// --- STORAGE UTILITY FUNCTION ---

/**
 * Uploads a file buffer to GCS, makes it public, and returns the permanent public URL.
 * @param {object} file - The file object provided by Multer.
 * @returns {string} The Signed URL of the uploaded file.
 */
const uploadFileToStorage = async (file) => {
    if (!file) return null;

    const timestamp = Date.now();
    const fileName = `items/${timestamp}_${file.originalname.replace(/ /g, '_')}`;
    const fileUpload = bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
        metadata: {
            contentType: file.mimetype,
        },
    });

    return new Promise((resolve, reject) => {
        stream.on('error', (err) => {
            console.error('Storage Upload Error:', err);
            reject(new Error('Failed to upload file to storage.'));
        });

        stream.on('finish', async () => {
            // Make the file public for permanent display
            await fileUpload.makePublic(); 
            
            // Return the permanent public URL
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
            
            resolve(publicUrl); // Returns a simple URL string
        });
        
        stream.end(file.buffer); 
    });
};

// --- AI UTILITY FUNCTION (GEMINI EMBEDDING) ---
// Vertex AI Setup for Text Embedding (Simple and reliable)
const LOCATION = 'asia-southeast1'; // Using stable region for the model
const EMBEDDING_MODEL_ID = 'text-embedding-004'; // Reliable text-only model
const VERTEX_ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL_ID}:predict`;
/**
 * Generates a text vector using the Vertex AI Text Embedding Model (text-embedding-004).
 * @param {string} text - The text description to embed.
 * @returns {number[] | null} A vector (array of numbers).
 */
const generateEmbedding = async (text) => { 
    try {
        const accessToken = await authClient.getAccessToken();

        const payload = {
            instances: [{ content: text }],
        };

        const response = await axios.post(
            VERTEX_ENDPOINT,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const embedding = response.data.predictions[0].embeddings.values;
        console.log(`✅ SUCCESS: Generated text vector of length ${embedding.length} (768D expected).`);
        return embedding;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response ? error.response.status : 'N/A';
            console.error(`Vertex AI Text Embedding Failed (Status ${status}): ${JSON.stringify(error.response.data)}`);
        }
        return null;
    }
};

/**
 * Calculates the Cosine Similarity between two vectors.
 * Score is between 0 (no similarity) and 1 (identical).
 * Formula: Cosine Similarity = (A . B) / (||A|| * ||B||)
 * @param {number[]} vecA - Query vector
 * @param {number[]} vecB - Target vector
 * @returns {number} The similarity score (0 to 1).
 */
const cosineSimilarity = (vecA, vecB) => {
    // Basic validation to ensure both are valid arrays of the same length
    if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
        return 0;
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    // Prevent division by zero
    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    // Result is the dot product divided by the product of the magnitudes
    return dotProduct / (magnitudeA * magnitudeB);
};

// --- MATCHING UTILITY FUNCTION ---

/**
 * Executes the vector-based matching logic using the provided embedding.
 * @param {number[]} queryVector - The text embedding of the item.
 * @param {string} targetStatus - The status of items to match against ('lost' or 'found').
 * @returns {object[]} Array of found item matches that exceed the similarity threshold.
 */
const getPotentialMatches = async (queryVector, targetStatus) => {
    const SIMILARITY_THRESHOLD = 0.8; // Use the same threshold as Route 4
    const MAX_MATCHES = 5;

    // 1. Fetch all eligible target items (opposite status, approved, unresolved)
    const targetSnapshot = await db.collection('items')
        .where('status', '==', targetStatus)
        .where('isApproved', '==', true)
        .where('isResolved', '==', false)
        .get();
    
    // 2. Calculate Similarity for each target item
    const matches = [];

    targetSnapshot.docs.forEach(targetDoc => {
        const targetItem = targetDoc.data();
        const targetVector = targetItem.textEmbedding;

        if (!targetVector || targetVector.length === 0) {
            return; 
        }
        
        const score = cosineSimilarity(queryVector, targetVector);

        if (score >= SIMILARITY_THRESHOLD) {
            matches.push({
                id: targetDoc.id,
                score: parseFloat(score.toFixed(4)), 
                ...targetItem
            });
        }
    });
    
    // 3. Sort by score and limit results
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, MAX_MATCHES);
};

// --- EMAIL UTILITY FUNCTION ---

/**
 * Sends a match notification email to the poster of the lost item.
 * @param {string} recipientEmail - Email of the user who posted the lost item.
 * @param {object} lostItem - The user's lost item data.
 * @param {object[]} matches - Array of found item matches.
 */
const sendMatchNotification = async (recipientEmail, lostItem, matches) => {
    if (matches.length === 0) return;

    // Construct the email body with details about the lost item and matches
    const matchesList = matches.map(match => `
        <li>
            <strong>Found Item: ${match.name}</strong> (Score: ${match.score * 100}%)<br>
            Description: ${match.description}<br>
            Location Found: ${match.lastSeenLocation || 'N/A'}<br>
            </li>
    `).join('');

    const mailOptions = {
        from: `"${lostItem.name} Match Alert" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: `[LostHub] Possible Match Found for: ${lostItem.name}`,
        html: `
            <p>Hello,</p>
            <p>Good news! We found ${matches.length} possible matches for your lost item, 
            <strong>"${lostItem.description}"</strong>, reported on ${new Date().toLocaleDateString()}.</p>
            
            <h3>Possible Found Items:</h3>
            <ul>${matchesList}</ul>

            <p>Please log in to your account to view more details on the item(s).</p>
            <p>Thank you,<br>LostHub Team</p>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ SUCCESS: Match email sent to ${recipientEmail}. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`❌ ERROR sending match email to ${recipientEmail}:`, error.message);
    }
};

// --- CORE ITEM LOGIC ---

/**
 * Handles item creation, file upload, text embedding, and saving to Firestore.
 */
const createItemPost = async (req, res, frontendData, file) => {
    
    if (!frontendData.name || !frontendData.status || !frontendData.category || !frontendData.lastSeenLocation || !frontendData.description) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required item fields: name, description, status, category or last seen location.' 
        });
    }

    try {
        let finalImageUrl = null; // Stored in DB
        
        // 2. Upload image and get URL (Image for display only)
        if (file) {
            finalImageUrl = await uploadFileToStorage(file);
        }
        
        // *** TEXT EMBEDDING GENERATION (Compulsory Text Input) ***
        let textVector = []; 
        const itemText = frontendData.description || frontendData.name;

        if (itemText) {
            console.log("Generating text vector...");
            // Call the simplified text embedding function
            textVector = await generateEmbedding(itemText); 
            
            if (!textVector || textVector.length === 0) {
                 console.warn("Could not generate vector. Item posted without embedding.");
            }
        }

        // 3. CONSTRUCTING THE FIRESTORE DOCUMENT
        const serverGeneratedFields = {
            posterUid: req.user.uid, 
            isApproved: false, 
            isResolved: false, 
            dateReported: admin.firestore.FieldValue.serverTimestamp(),
            textEmbedding: textVector, // Store the text vector
            imageUrl: finalImageUrl, 
            lastSeenLocation: frontendData.lastSeenLocation,
            itemCollectLocation: frontendData.status === 'found' ? frontendData.itemCollectLocation || 'Pending location details' : null
        };
        
        const itemDocument = {
            ...frontendData, 
            ...serverGeneratedFields
        };
        delete itemDocument.imageTempRef; 
        const docRef = await db.collection('items').add(itemDocument);

        return res.status(201).json({
            success: true,
            message: `${frontendData.status} item successfully posted for approval.`,
            itemId: docRef.id 
        });
        
    } catch (error) {
        console.error('SERVER ERROR:', error.message || error);
        return res.status(500).json({ success: false, message: 'Internal Server Error during data processing.' });
    }
}

// --- API ROUTES ---

// Health Check / Default Route
app.get("/", (req, res) => {
    res.send("Hello from the Lost & Found Backend!");
});


// 1. CREATE ITEM POST ROUTE (POST /api/items)
// 'upload.single('itemImage')' is the Multer middleware that handles the file named 'itemImage'
app.post('/api/items', verifyToken, upload.single('itemImage'), async (req, res) => {
    // req.body contains the JSON data, req.file contains the image file
    await createItemPost(req, res, req.body, req.file);
});


// 2. READ & FILTER ITEMS ROUTE (GET /api/items)
app.get('/api/items', verifyToken, async (req, res) => {
    
    // Extract query parameters from req.query
    const { category, status, sortBy, sortOrder, approvalStatus } = req.query; 
    // Check the requester's role
    const userRole = req.user.role;

    try {
        let itemsRef = db.collection('items');
        let query = itemsRef;
        // --- 1. BASE QUERY LOGIC (Conditional based on Role/Request) ---
        // Admin View: Allow filtering by 'approved' or 'pending'
        if (userRole === 'admin') {
        // Default: Show all items (pending & approved) unless a status is specified
            if (approvalStatus === 'pending') {
                // 🎯 FIX: Filter for PENDING (isApproved == false)
                query = query.where('isApproved', '==', false);

        } else if (approvalStatus === 'approved') {
            // Filter for APPROVED (isApproved == true)
            query = query.where('isApproved', '==', true);
        }

        // Admins usually see unresolved items by default, but we'll include the filter for safety
        query = query.where('isResolved', '==', false);

        } else {
            // Standard User View (Public): Filter for APPROVED and UNRESOLVED only
            query = query.where('isApproved', '==', true)
                        .where('isResolved', '==', false);
        }

        // 2. DYNAMIC FILTERING (Exact Match) *Remove based on final implementation*
        if (category) {
            // Filter by item type/category
            query = query.where('category', '==', category);
        }

        if (status && (status === 'lost' || status === 'found')) {
            // Filter by item status
            query = query.where('status', '==', status);
        }
        
        // 3. SORTING (Includes date filtering)
        // Default sort field is 'dateReported' (Newest first)
        const sortField = sortBy || 'dateReported';
        // Order must be 'asc' or 'desc'. Default descending.
        const order = sortOrder === 'asc' ? 'asc' : 'desc'; 
        
        // IMPORTANT: Firestore requires an orderBy() on any field used in a range or inequality filter.
        // For basic exact matching (==), you can sort on any field.
        query = query.orderBy(sortField, order);


        // 4. Execute the Query
        const snapshot = await query.get();

        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json(items);
    } catch (error) {
        console.error('Firestore Error during GET /api/items:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve items.' });
    }
});


// 3. USER & ADMIN MANAGEMENT ENDPOINTS

// Route 3a: Register New User
app.post('/api/auth/register', async (req, res) => {
    // In a real app, you would validate email/password here.
    const { email, password, displayName } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        // 1. Create user in Firebase Auth
        const userRecord = await auth.createUser({ email, password, displayName });

        // 2. Create corresponding document in Firestore 'users' collection (for isAdmin flag)
        await db.collection('users').doc(userRecord.uid).set({
            email: userRecord.email,
            displayName: displayName || 'User',
            isAdmin: false, // Default is false
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({ 
            success: true, 
            message: "User created successfully. Please log in.", 
            uid: userRecord.uid 
        });

    } catch (error) {
        console.error("Registration Error:", error.message);
        // Handle common Firebase Auth errors (e.g., email-already-in-use)
        res.status(400).json({ message: error.message });
    }
});


// Route 3b: Set Admin Role (Admin Utility - needs protection later)
app.post('/api/admin/set-role', verifyToken, async (req, res) => {
    const { targetUid, role } = req.body; // targetUid: UID to promote, role: 'admin' or 'user'

    if (!targetUid) {
        return res.status(400).json({ message: "Target UID is required." });
    }
    
    const isAdmin = role === 'admin';

    try {
        // 1. Update Custom Claims in Firebase Auth (best for runtime checks)
        await auth.setCustomUserClaims(targetUid, { admin: isAdmin });

        // 2. Update Firestore document (good for lookup/display)
        await db.collection('users').doc(targetUid).update({ isAdmin: isAdmin });

        res.status(200).json({ 
            success: true, 
            message: `User ${targetUid} role set to ${role}.` 
        });

    } catch (error) {
        console.error("Admin Role Error:", error.message);
        res.status(500).json({ message: "Failed to set user role." });
    }
});

// Route 3c: Login User (Issues a session token with role claims)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        // 1: Authenticate user using Firebase Client SDK equivalent
        // Since Firebase Admin SDK cannot sign in users, we use a utility API.
        // NOTE: This uses the Identity Toolkit REST API, which requires the project's Web API Key.
        const WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY; 
        const SIGN_IN_ENDPOINT = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${WEB_API_KEY}`;
        
        // Make the external API call to verify the user's password
        const signInResponse = await axios.post(SIGN_IN_ENDPOINT, {
            email: email,
            password: password,
            returnSecureToken: true
        });

        const idToken = signInResponse.data.idToken;
        const localId = signInResponse.data.localId;
        
        // 2: Get the user's role from Firestore
        const userDoc = await db.collection('users').doc(localId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: "User profile not found in database." });
        }
        const userData = userDoc.data();
        const role = userData.isAdmin ? 'admin' : 'user';

        // 3: Optionally update Firebase Custom Claims (for future security checks)
        await auth.setCustomUserClaims(localId, { role: role });

        // 4: Respond with the necessary data for the frontend
        res.status(200).json({ 
            success: true, 
            message: "Login successful.", 
            token: idToken, // The Firebase ID Token (JWT)
            user: {
                uid: localId,
                email: email,
                displayName: userData.displayName,
                role: role // Crucial for frontend routing
            }
        });

    } catch (error) {
        let message = "Login failed. Invalid email or password.";
        if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
             // Extract specific errors from the Identity Toolkit API
             message = error.response.data.error.message.replace(/EMAIL_NOT_FOUND|INVALID_PASSWORD/g, 'Invalid email or password.');
        } else {
             console.error("Login Error:", error.message);
        }
        res.status(401).json({ message: message });
    }
});

// Route 3d: Verify Token Validity
app.get('/api/auth/verify-token', verifyToken, async (req, res) => {
    
    // We get the UID and the working 'role' from the decoded token payload (req.user)
    const uid = req.user.uid; 
    const roleFromToken = req.user.role || 'user';

    try {
        // 🔥 CRITICAL STEP: Fetch the full user record from Firebase Authentication.
        // This is necessary because the JWT payload (req.user) does not contain displayName.
        const userRecord = await auth.getUser(uid);
        
        // If successful, userRecord.displayName will contain the correct name.
        
        res.status(200).json({ 
            success: true, 
            message: "Token is valid.",
            // IMPORTANT: Return user data including the role for context
            user: {
                uid: uid,
                email: req.user.email,
                // ✅ Use the displayName from the full user record
                displayName: userRecord.displayName, 
                // ✅ Use the role from the token (which is faster than the full userRecord)
                role: roleFromToken 
            }
        });

    } catch (error) {
        // Handle token valid but user record fetch failure (e.g., user deleted)
        console.error("Error fetching full user record during verification:", error.message);
        // We must call logout on the frontend, so return an error status
        res.status(401).json({ success: false, message: "Verification failed or user profile error." });
    }
});

// 3e. Route for Admin to Approve an Item and Trigger Matching (NEW!)
app.post('/api/admin/approve-item/:itemId', verifyToken, async (req, res) => {
    const { itemId } = req.params;
    
    // 🛑 SECURITY CHECK: Ensure requester is an admin.
    // NOTE: This check should be based on the 'role' custom claim in req.user
    if (req.user.role !== 'admin') { 
        return res.status(403).json({ success: false, message: 'Admin access required for item approval.' }); 
    }

    try {
        let potentialMatches = [];
        // 1. Update the item status to APPROVED
        await db.collection('items').doc(itemId).update({ isApproved: true });
        
        // 2. Get the item data and vector
        const approvedDoc = await db.collection('items').doc(itemId).get();
        const approvedItem = approvedDoc.data();
        const queryVector = approvedItem.textEmbedding;
        let targetStatus/*, matchItem, notifyUser */= false;

        if (approvedItem.status === 'lost') {
            // SCENARIO 1: Newly Approved item is LOST. Search for FOUND matches.
            targetStatus = 'found';
            //notifyUser = true; // Notify the current user (lost item poster)
            //matchItem = approvedItem;
        
        } else if (approvedItem.status === 'found') {
            // SCENARIO 2: Newly Approved item is FOUND. Search for LOST matches.
            targetStatus = 'lost';
            // We notify the poster of the *matching* lost item, so we need the full match data first.
        }

        if (queryVector && queryVector.length > 0) {
            
            // a. Find matches (Search against approved targets of the opposite status)
            potentialMatches = await getPotentialMatches(queryVector, targetStatus); 

            // b. Handle Notifications based on Scenario
            if (potentialMatches.length > 0) {

                if (approvedItem.status === 'lost') {
                    // Scenario 1: Notify the user who just posted the LOST item.
                    const userDoc = await db.collection('users').doc(approvedItem.posterUid).get();
                    const recipientEmail = userDoc.data()?.email;

                    if (recipientEmail) {
                        await sendMatchNotification(recipientEmail, approvedItem, potentialMatches);
                    }

                } else if (approvedItem.status === 'found') {
                    // Scenario 2: Notify the user(s) who posted the matching LOST item(s).
                    for (const match of potentialMatches) {
                        const lostItem = match; // The match is the lost item
                        
                        // Need to fetch the lost user's email
                        const userDoc = await db.collection('users').doc(lostItem.posterUid).get();
                        const recipientEmail = userDoc.data()?.email;

                        if (recipientEmail) {
                            // sendMatchNotification(recipientEmail, lostItem, [approvedItem]);
                            // We need to tell the lost user about the item that was just found.
                            await sendMatchNotification(recipientEmail, lostItem, [approvedItem]);
                        }
                    }
                }
            }
        }

        res.status(200).json({ 
            success: true, 
            message: `Item ${itemId} approved. Match check completed.`,
            isMatchFound: (potentialMatches?.length > 0)
        });

    } catch (error) {
        console.error(`Admin Approval Error for item ${itemId}:`, error.message);
        res.status(500).json({ success: false, message: 'Failed to approve item and run match check.' });
    }
});

// Route 3f: Admin Delete Item
app.delete('/api/admin/items/:itemId', verifyToken, async (req, res) => {
    const { itemId } = req.params;
    
    // SECURITY CHECK: Ensure requester is an admin.
    if (req.user.role !== 'admin') { 
        return res.status(403).json({ success: false, message: 'Admin access required for deletion.' }); 
    }

    try {
        // 1. Fetch the item data BEFORE deletion to get the image URL
        const itemDoc = await db.collection('items').doc(itemId).get();
        if (!itemDoc.exists) {
            return res.status(404).json({ success: false, message: 'Item not found.' });
        }
        const itemData = itemDoc.data();
        const imageUrl = itemData.imageUrl; 

        // 2. Delete the item document from Firestore
        await db.collection('items').doc(itemId).delete();
        
        // 3. Delete the associated image from Cloud Storage (Data Hygiene)
        if (imageUrl) {
            // Construct the path by removing the base URL
            const urlParts = imageUrl.split('/');
            // The file path starts after the bucket name (usually the 5th segment)
            const filePath = urlParts.slice(4).join('/'); 

            // Delete the file from the bucket
            await bucket.file(filePath).delete();
            console.log(`✅ SUCCESS: Deleted image file: ${filePath}`);
        }

        res.status(200).json({ 
            success: true, 
            message: `Item ${itemId} and associated file successfully deleted.` 
        });

    } catch (error) {
        // Handle case where file might already be deleted, or other GCS errors.
        if (error.code === 404) {
            console.warn(`GCS Warning: File for item ${itemId} not found on deletion.`);
        } else {
             console.error(`Admin Deletion Error for item ${itemId}:`, error.message);
             // Re-throw 500 error if it wasn't a GCS file-not-found warning
             return res.status(500).json({ success: false, message: 'Failed to delete item or associated file.' });
        }
        
        // If the deletion was successful (despite a warning), send success status
        res.status(200).json({ 
            success: true, 
            message: `Item ${itemId} deleted from Firestore (GCS file check completed).` 
        });

    }
});

// Route 3g: Admin Search Users by Email or DisplayName (FINALIZED SIMPLIFIED)
app.get('/api/admin/users/search', verifyToken, async (req, res) => {
    
    // 1. Setup and Security Check
    const { term } = req.query; 

    // Ensure only Admins can perform user searches
    if (req.user.role !== 'admin') { 
        return res.status(403).json({ success: false, message: 'Admin access required for user search.' }); 
    }
    /*
    // Minimum length check (Using 1 as requested)
    if (!term || term.length < 1) {
        return res.status(200).json({ success: true, users: [] }); 
    }
    */
    try {
        let uniqueUsersMap = new Map();

        // Helper to fetch user data and populate the map
        const fetchAndMapUsers = (snapshot) => {
            snapshot.docs.forEach(doc => {
                const userData = doc.data();
                const uid = doc.id;
                
                // Exclude the currently logged-in admin user
                if (uid === req.user.uid) return; 

                // Store only the required fields
                uniqueUsersMap.set(uid, {
                    uid: uid,
                    email: userData.email,
                    displayName: userData.displayName || 'No Name',
                    isAdmin: userData.isAdmin,
                });
            });
        };

        const isSearching = term && term.length >= 1;
        if (isSearching) {
            const termLower = term.toLowerCase(); 
            const termUpper = term + '\uf8ff'; // Term for DisplayName search range

            // 2. Search by Display Name (Prefix Match, limit 10)
            // Note: Uses the original term for case-sensitive DB lookup
            const nameSnapshot = await db.collection('users')
                .where('displayName', '>=', term)
                .where('displayName', '<=', termUpper)
                .orderBy('displayName', 'asc') 
                .limit(10)
                .get();
            fetchAndMapUsers(nameSnapshot);


            // 3. Search by Email (Prefix Match, limit 10)
            // Note: Uses the lowercase term for email search
            const emailSnapshot = await db.collection('users')
                .where('email', '>=', termLower)
                .where('email', '<=', termLower + '\uf8ff') 
                .orderBy('email', 'asc') 
                .limit(10)
                .get();
            fetchAndMapUsers(emailSnapshot);

        } else {
            // 🎯 FIX: If no search term, fetch the full, un-searched list (max 20)
            const allUsersSnapshot = await db.collection('users')
                .orderBy('email', 'asc') 
                .limit(20) // Limit the list size for performance
                .get();
            fetchAndMapUsers(allUsersSnapshot);
        }
        
        // 4. Merge, Sort, and Respond
        let finalUsers = Array.from(uniqueUsersMap.values());
        
        // Final sort alphabetically by display name (or email if name is missing)
        finalUsers.sort((a, b) => {
            const labelA = a.displayName || a.email;
            const labelB = b.displayName || b.email;
            return labelA.localeCompare(labelB);
        });

        res.status(200).json({
            success: true,
            message: `Found ${finalUsers.length} user(s) matching the search term.`,
            users: finalUsers 
        });

    } catch (error) {
        console.error('Admin Search Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to perform user search.' });
    }
});

// 4. MATCHING ROUTE (GET /api/items/:itemId/matches)
app.get('/api/items/:itemId/matches', verifyToken, async (req, res) => {
    const { itemId } = req.params;

    try {
        // 1. Get the Query Item and its embedding (The item the user is looking at)
        const queryDoc = await db.collection('items').doc(itemId).get();
        if (!queryDoc.exists) {
            return res.status(404).json({ success: false, message: 'Item not found.' });
        }
        const queryItem = queryDoc.data();
        const queryVector = queryItem.textEmbedding; // This is the vector we need for matching

        // Ensure the query item has a valid vector
        if (!queryVector || queryVector.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: "No embedding found for this item. Cannot run matching.", 
                matches: [] 
            });
        }
        
        // Determine the opposite status (Needed for the final response metadata)
        const targetStatus = queryItem.status === 'lost' ? 'found' : 'lost';

        // 2. 🔑 Call the new reusable utility function!
        // It does the fetching, calculating, sorting, and limiting internally.
        const topMatches = await getPotentialMatches(queryVector, targetStatus); 

        // 3. Send the final JSON response
        res.status(200).json({ 
            success: true,
            queryId: itemId,
            targetStatus: targetStatus,
            matches: topMatches // Returns the structured match array
        });

    } catch (error) {
        console.error('Matching Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to find matches.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Backend is serving on port ${PORT}`);
});
export default app;