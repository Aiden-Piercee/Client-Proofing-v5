# Koken API Integration Manifest for Codex

This document provides the exact references Codex should use to correctly implement every Koken API call. It is intentionally structured and concise so Codex can reliably follow it without hallucinating undefined fields or endpoints.

## 1. Core API Files Supplied to Codex

These files define all routing, models, relationships, and response structures inside Koken. Codex must treat these files as the authoritative source of truth.

### Required Files

```
api.php
app/application/controllers/contents.php
app/application/controllers/albums.php
app/application/controllers/tags.php
app/application/controllers/categories.php
app/application/models/content.php
app/application/models/album.php
app/application/models/tag.php
app/application/models/category.php
app/application/core/Koken_Controller.php
```

### Optional but Helpful

```
storage/cache/api/*.json
app/application/config/routes.php
```

These provide real-world response examples and routing patterns.

---

## 2. Codex Rules for Using These Files

Codex should:

1. Parse controllers to understand available endpoints.
2. Parse models to understand valid fields and relationships.
3. Use `Koken_Controller` to understand how responses are shaped.
4. Use cached JSON files to confirm object schemas.
5. Never create new fields not present in the referenced files.
6. Infer UI requirements from these structures.

---

## 3. API Endpoint Overview

Codex must generate an API client that supports the following endpoints exactly as defined inside the attached controller files.

### Content Endpoints

```
GET /content
GET /content/:id
PUT /content/:id
GET /content/:id/categories
PUT /content/:id/categories
GET /content/:id/tags
PUT /content/:id/tags
```

### Album Endpoints

```
GET /albums
GET /albums/:id
GET /albums/:id/content
PUT /albums/:id
```

### Category Endpoints

```
GET /categories
GET /categories/:id/content
```

### Tag Endpoints

```
GET /tags
GET /tags/:id/content
```

---

## 4. Data Models

Codex should derive all model definitions from the supplied model files. Below is a distilled representation for orientation only.

### Content Object

```
id
filename
title
caption
visibility
created_on
modified_on
published_on
dimensions { width, height }
tags[]
categories[]
albums[]
```

### Album Object

```
id
title
slug
visibility
order
cover_id
content_count
```

### Tag Object

```
id
title
slug
count
```

### Category Object

```
id
title
slug
parent_id
```

Codex should always prefer exact fields found in the real PHP model files.

---

## 5. UI Integration Rules

When generating UI code:

### Sidebar Data

Use:

```
GET /albums
GET /categories
GET /tags
GET /content?group_by=date
```

### Main Grid

Use:

```
GET /content
GET /albums/:id/content
GET /tags/:id/content
GET /categories/:id/content
```

### Inspector Panel

Editable fields must map to:

```
PUT /content/:id
PUT /content/:id/categories
PUT /content/:id/tags
```

Non-editable fields must be rendered read-only.

---

## 6. Implementation Notes for Codex

1. Maintain Koken’s dark, compact admin aesthetic.
2. Avoid inventing fields.
3. Use pagination or offset-based loading when needed.
4. Reflect album/content/tag relationships exactly as defined in the model files.
5. Implement safe updating (`PUT`) following Koken_Controller conventions.

---

## 7. Output Requirements

Codex should generate:

* A typed API client
* UI components that mirror Koken’s structure (Sidebar, Grid, Inspector)
* Utilities for filtering, sorting, and loading content
* Integration that respects Koken’s visibility and metadata rules

Codex must derive all logic only from the supplied Koken files.

---

This manifest ensures Codex will correctly interpret and implement the entire Koken API without guessing or deviating from the original system architecture.
