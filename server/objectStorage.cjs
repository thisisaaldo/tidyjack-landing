const { Storage } = require("@google-cloud/storage");
const { randomUUID } = require("crypto");

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Object storage client for Replit
const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

class ObjectStorageService {
  constructor() {}

  // Gets the private object directory for photo uploads
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "tidyjacks-photos/uploads";
    return dir;
  }

  // Gets the upload URL and storage path for a photo
  async getPhotoUploadURL() {
    // Simplified approach - use direct server upload instead of signed URLs
    const objectId = `${Date.now()}_${randomUUID()}`;
    const storagePath = `/tidyjacks-photos/${objectId}.jpg`;

    return {
      uploadURL: `/api/admin/photos/direct-upload`, // Direct upload to our server
      storagePath: storagePath,
      objectId: objectId // Include objectId for the upload
    };
  }

  // Gets a photo file from storage
  async getPhotoFile(filePath) {
    const { bucketName, objectName } = parseObjectPath(filePath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    const [exists] = await file.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    
    return file;
  }

  // Downloads a photo file to the response
  async downloadPhoto(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      
      res.set({
        "Content-Type": metadata.contentType || "image/jpeg",
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      const stream = file.createReadStream();
      
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming photo" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading photo:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading photo" });
      }
    }
  }

  // Generate a public URL for a photo
  generatePhotoURL(filePath) {
    // Convert file path to public URL format - works with catch-all route
    const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    return `/api/photos/${normalizedPath}`;
  }
}

function parseObjectPath(path) {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

module.exports = {
  ObjectStorageService,
  ObjectNotFoundError,
  objectStorageClient
};