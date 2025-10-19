import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { verifyToken } from "../middleware/middleware.js";

dotenv.config();

const router = express.Router();

// CORS for frontend origin if provided
const FRONTEND_URL = process.env.FRONTEND_URL;
const PRODUCTION_URL = "http://3.139.56.157";
const allowedOrigins = [FRONTEND_URL, PRODUCTION_URL].filter(Boolean);

router.use(cors({ 
  origin: allowedOrigins.length > 0 ? allowedOrigins : true, 
  credentials: false, 
  methods: ["GET","POST","DELETE","OPTIONS","PUT"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
router.use(express.json());

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.S3_BUCKET;
const DEFAULT_PREFIX = process.env.S3_PREFIX || "";

function makeObjectKey(filename, userId, prefix = DEFAULT_PREFIX) {
  const safeName = String(filename || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
  const id = crypto.randomUUID();
  const userPrefix = userId ? `users/${userId}/` : "";
  
  if (prefix && prefix.includes('canvas-previews')) {
    console.log('Using canvas-previews structure for:', filename);
    return `${prefix}${userPrefix}${safeName}`;
  }
  
  return `${prefix}${userPrefix}${id}-${safeName}`;
}

function isUserOwnedKey(key, userId) {
  if (!key || !userId) return false;
  const normalized = String(key).replace(/^\/+/, "");
  const expected = `${DEFAULT_PREFIX}users/${userId}/`;
  const canvasPreviewExpected = `canvas-previews/users/${userId}/`;
  return normalized.startsWith(expected) || normalized.startsWith(canvasPreviewExpected);
}

router.post("/s3/presign", verifyToken, async (req, res) => {
  try {
    const { filename, contentType, prefix } = req.body || {};
    const userId = req.user?.sub;


    if (!BUCKET) return res.status(500).json({ error: "missing_bucket" });
    if (!filename || !contentType) {
      return res.status(400).json({ error: "filename and contentType are required" });
    }
    if (!userId) {
      return res.status(401).json({ error: "user authentication required" });
    }

    const Key = makeObjectKey(filename, userId, prefix || DEFAULT_PREFIX);

    const command = new PutObjectCommand({ Bucket: BUCKET, Key, ContentType: contentType });
    const expiresIn = 60; // seconds
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
    // Generate public URL for after upload
    const publicUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`;
    return res.json({ key: Key, url: uploadUrl, publicUrl, expiresIn });
  } catch (err) {
    console.error("s3 presign error:", err);
    res.status(500).json({ error: "failed_to_presign" });
  }
});

// GET /api/s3/images?prefix=&token=
router.get("/s3/images", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.sub; // Get user ID from JWT token

    if (!BUCKET) return res.status(500).json({ error: "missing_bucket" });
    if (!userId) {
      return res.status(401).json({ error: "user authentication required" });
    }

    const basePrefix = req.query.prefix || DEFAULT_PREFIX;
    const userPrefix = `users/${userId}/`;
    const prefix = basePrefix + userPrefix;
    const ContinuationToken = req.query.token || undefined;

    const listResp = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken,
        MaxKeys: 100,
      })
    );

    const allowedExtensions = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "bmp",
      "tiff",
      "svg",
      "mp4",
      "mov",
      "webm",
      "avi",
      "mkv",
    ];
    const objects = (listResp.Contents || []).filter((o) =>
      new RegExp(`\\.(${allowedExtensions.join("|")})$`, "i").test(o.Key)
    );
    const items = objects.map((o) => {
      // Generate public URL instead of signed URL
      const url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${o.Key}`;
      return { key: o.Key, url, size: o.Size, lastModified: o.LastModified };
    });

    res.json({
      items,
      nextToken: listResp.IsTruncated ? listResp.NextContinuationToken : null,
    });
  } catch (err) {
    console.error("s3 list error:", err);
    res.status(500).json({ error: "failed_to_list" });
  }
});

/**
 * DELETE /api/s3/file
 * Body:
 *   { key: "prefix/users/<userId>/..." }
 *   or { keys: ["...", "..."] }  // batch up to 1000 (S3 limit per call)
 *
 * Only deletes keys owned by the authenticated user (enforced by prefix check).
 */
router.delete("/s3/file", verifyToken, async (req, res) => {
  try {
    if (!BUCKET) return res.status(500).json({ error: "missing_bucket" });

    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: "user authentication required" });

    const { key, keys } = req.body || {};

    // Single delete
    if (key) {
      if (!isUserOwnedKey(key, userId)) {
        return res.status(403).json({ error: "forbidden_key" });
      }
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return res.json({ ok: true, deleted: [key] });
    }

    // Batch delete
    if (Array.isArray(keys) && keys.length > 0) {
      const owned = keys.filter((k) => isUserOwnedKey(k, userId));
      const rejected = keys.filter((k) => !isUserOwnedKey(k, userId));

      if (owned.length === 0) {
        return res.status(403).json({ error: "no_ownable_keys", rejected });
      }

      const resp = await s3.send(
        new DeleteObjectsCommand({
          Bucket: BUCKET,
          Delete: { Objects: owned.map((k) => ({ Key: k })) },
        })
      );

      const deleted = (resp?.Deleted || []).map((d) => d.Key);
      const errors = (resp?.Errors || []).map((e) => ({ key: e.Key, message: e.Message }));

      return res.json({ ok: true, deleted, rejected, errors });
    }

    return res.status(400).json({ error: "must_provide_key_or_keys" });
  } catch (err) {
    console.error("s3 delete error:", err);
    res.status(500).json({ error: "failed_to_delete" });
  }
});

export default router;
