# PawPals Backend API

Base URL: `http://localhost:3000/api`

All responses use:

```json
{ "ok": true, "data": {} }
```

Errors use:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request input",
    "details": {}
  }
}
```

Protected endpoints accept either the `pawpals_token` HTTP-only cookie or:

```http
Authorization: Bearer <jwt>
```

Pagination query params: `page`, `limit`, and optionally `cursor`.

## Auth

- `POST /auth/register` - `{ name, username, email, password }`
- `POST /auth/login` - `{ email, password }`
- `POST /auth/logout`
- `GET /auth/me`

## Users

- `PATCH /users/me` - update owner profile, including `isPrivate`
- `POST /users/me/avatar` - multipart form field `file`
- `GET /users/:id`
- `POST /users/:id/follow`
- `DELETE /users/:id/follow`
- `GET /users/:id/followers`
- `GET /users/:id/following`

Private accounts hide posts, followers, following, and chat access from other users.

## Cat Profiles

- `GET /cats?q=&breed=&gender=&ageMin=&ageMax=&city=&personality=`
- `GET /cats/nearby?city=New%20York`
- `POST /cats`
- `GET /cats/:id`
- `PATCH /cats/:id`
- `DELETE /cats/:id`
- `POST /cats/:id/photos` - multipart form field `file`

Cat payload:

```json
{
  "name": "Luna",
  "ageMonths": 24,
  "gender": "FEMALE",
  "breed": "Persian",
  "personalityTags": ["Calm", "Friendly"],
  "lookingFor": ["Playdate"],
  "city": "New York",
  "description": "Loves sunny windows."
}
```

## Discover

- `POST /discover/swipes` - `{ catId, action: "LIKE" | "SKIP" }`
- `GET /discover/matches`

Swipes are unique by user and cat. A match is created when owners mutually like each other's cats.

## Feed And Posts

- `GET /feed?mode=for-you|following|trending&topic=HEALTH`
- `GET /posts?topic=MEMES`
- `POST /posts` - `{ text, topic, mediaUrls }`
- `GET /posts/:id`
- `PATCH /posts/:id`
- `DELETE /posts/:id`
- `POST /posts/:id/like`
- `POST /posts/:id/save`
- `GET /posts/:id/comments`
- `POST /posts/:id/comments`
- `DELETE /comments/:id`

## Stories And Memes

- `GET /stories` - active stories only
- `POST /stories` - stories expire after 24 hours
- `POST /stories/:id/view`
- `POST /stories/:id/like`

Use `topic: "MEMES"` on posts to create meme posts.

## Chat

- `GET /conversations`
- `POST /conversations` - `{ userId }`
- `GET /conversations/:id/messages`
- `POST /conversations/:id/messages` - `{ body, type: "TEXT" }`
- `POST /conversations/:id/read`

Message schema is prepared for future `IMAGE` and `STICKER` types.

## Vet Directory

- `GET /vets?q=&city=&open=true&minRating=4&service=CHECKUP`
- `GET /vets/:id`
- `POST /vets/:id/favorite`

## Events

- `GET /events?q=&category=MEETUPS&city=New%20York`
- `POST /events`
- `GET /events/:id`
- `PATCH /events/:id`
- `DELETE /events/:id`
- `POST /events/:id/rsvp`
- `DELETE /events/:id/rsvp`
- `POST /events/:id/save`

## Health Tips

- `GET /health-tips?q=&category=NUTRITION`
- `POST /health-tips`
- `GET /health-tips/daily`
- `POST /health-tips/:id/save`

## Notifications

- `GET /notifications`
- `POST /notifications`
- `POST /notifications/:id/read`

Notifications are also created automatically for matches, messages, and post likes/comments.

## Uploads

- `POST /uploads` - multipart form fields `file` and optional `folder`

Allowed file types: JPEG, PNG, WebP, GIF, MP4, WebM.

Default max size: `5MB`, configurable with `MAX_UPLOAD_BYTES`.
