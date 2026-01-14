# Backend API Requirements Report

This document lists all APIs used by the LayoutCraft frontend and their expected request/response structures.

---

## Authentication

All endpoints except public pages require authentication via Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

---

## 1. Design Generation APIs

### 1.1 Generate Designs

**Endpoint:** `POST /api/v1/generate`

**Description:** Generate new design images based on a text prompt.

**Request Body:**
```json
{
  "prompt": "string (required, max 500 chars)",
  "theme": "string (optional, default: 'auto')",
  "size_presets": ["string"] (required, array of preset names),
  "use_brand_kit": boolean (optional, default: false)
}
```

**Available Themes:**
- `auto` - AI auto-selects
- `minimal_luxury_space` - Minimal & Clean
- `bold_geometric_solid` - Bold Geometric
- `dark_neon_tech` - Neon / Tech
- `vibrant_gradient_energy` - Vibrant Energy

**Available Size Presets:**
- `blog_header` - 1200x630
- `social_square` - 1080x1080
- `story` - 1080x1920
- `twitter_post` - 1024x512
- `youtube_thumbnail` - 1280x720

**Response:**
```json
{
  "id": "string (generation_id)",
  "images_json": [
    {
      "size_preset": "string",
      "thumbnail_url": "string",
      "image_url": "string"
    }
  ]
}
```

---

### 1.2 Refine Designs

**Endpoint:** `POST /api/refine`

**Description:** Refine/edit existing designs with a new prompt.

**Request Body:**
```json
{
  "edit_prompt": "string (required)",
  "generation_id": "string (required)",
  "size_presets": ["string"] (required, array of presets to refine)
}
```

**Response:**
```json
{
  "id": "string (new generation_id)",
  "images_json": [
    {
      "size_preset": "string",
      "thumbnail_url": "string",
      "image_url": "string"
    }
  ]
}
```

---

## 2. History APIs

### 2.1 Get Parent Prompts

**Endpoint:** `GET /users/history/parents`

**Description:** Get paginated list of design session parents (original prompts).

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `offset` | integer | Yes | Pagination offset (0-based) |
| `limit` | integer | Yes | Number of items per page (default: 10) |

**Example:** `/users/history/parents?offset=0&limit=10`

**Response:**
```json
{
  "parents": [
    {
      "design_thread_id": "string",
      "original_prompt": "string",
      "thumbnail_url": "string | null",
      "edit_groups_count": integer,
      "created_at": "ISO 8601 datetime"
    }
  ],
  "has_next": boolean,
  "total": integer
}
```

---

### 2.2 Get Edit Groups

**Endpoint:** `GET /users/history/edit-groups`

**Description:** Get all edit groups (variations) for a specific design thread.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `thread_id` | string | Yes | The design_thread_id from parents |

**Example:** `/users/history/edit-groups?thread_id=abc123`

**Response:**
```json
{
  "edit_groups": [
    {
      "generation_id": "string",
      "prompt": "string",
      "prompt_type": "string ('original' | 'edit')",
      "theme": "string",
      "created_at": "ISO 8601 datetime",
      "images_json": [
        {
          "size_preset": "string",
          "thumbnail_url": "string",
          "image_url": "string"
        }
      ]
    }
  ]
}
```

---

## 3. Brand Kit API

### 3.1 Get Brand Kit

**Endpoint:** `GET /api/brand-kit`

**Description:** Retrieve user's saved brand kit.

**Response (if exists):**
```json
{
  "colors": {
    "primary": "string (hex color, e.g., '#6366f1')",
    "secondary": "string (hex color)",
    "accent": "string (hex color)"
  },
  "fonts": {
    "heading": "string (font family name)",
    "subheading": "string",
    "body": "string",
    "accent": "string",
    "caption": "string",
    "cta": "string",
    "small": "string"
  },
  "guidelines": "string (max 200 chars)"
}
```

**Response (if not exists):**
- Status: `404 Not Found`
- Or: Empty/null colors, fonts, guidelines

---

### 3.2 Save Brand Kit

**Endpoint:** `POST /api/brand-kit`

**Description:** Create or update user's brand kit.

**Request Body:**
```json
{
  "colors": {
    "primary": "string (hex color, optional)",
    "secondary": "string (hex color, optional)",
    "accent": "string (hex color, optional)"
  },
  "fonts": {
    "heading": "string (optional)",
    "subheading": "string (optional)",
    "body": "string (optional)",
    "accent": "string (optional)",
    "caption": "string (optional)",
    "cta": "string (optional)",
    "small": "string (optional)"
  },
  "guidelines": "string (max 200 chars, optional)"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## 4. Subscription API

### 4.1 Get Subscription Status

**Endpoint:** `GET /api/subscription` (or similar)

**Description:** Check user's subscription status.

**Response:**
```json
{
  "status": "string ('free' | 'trial' | 'pro' | 'cancelled')",
  "trial_ends_at": "ISO 8601 datetime | null",
  "subscription_ends_at": "ISO 8601 datetime | null"
}
```

---

## 5. Pro-Only Features

The following features require Pro subscription:

| Feature | Free User Behavior |
|---------|-------------------|
| **All Formats** (all size presets at once) | Locked, defaults to `blog_header` |
| **Multiple Dimensions** (more than 1 at a time) | Can only select 1 dimension |
| **Edit Group** (load past designs for editing) | Shows upgrade modal |
| **Use Brand Kit** toggle | Shows upgrade modal |
| **Brand Kit Page** | Shows locked overlay |

---

## 6. Error Responses

All endpoints may return:

```json
{
  "error": "string (error message)",
  "code": "string (error code, optional)"
}
```

**Common Error Codes:**
- `401` - Unauthorized (token expired or invalid)
- `403` - Forbidden (Pro feature for free user)
- `404` - Resource not found
- `429` - Rate limit exceeded
- `500` - Internal server error

---

## 7. Notes for Backend

### 7.1 Pagination
- History endpoints use offset-based pagination
- Frontend requests 10 items at a time
- Backend should return `has_next: true/false` to control Load More visibility

### 7.2 Brand Kit
- All fields are optional (user can specify only what they need)
- Empty string values should be treated as "not set"
- Colors should be validated as hex format
- Guidelines limited to 200 characters

### 7.3 Design Generation
- `use_brand_kit: true` should apply user's brand colors/fonts to generation
- If user has no brand kit but sends `use_brand_kit: true`, ignore or use defaults

### 7.4 Subscription Gating
- Backend should enforce Pro-only features even if frontend is bypassed
- Return `403 Forbidden` for unauthorized Pro feature access
