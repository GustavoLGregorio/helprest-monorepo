## 2024-03-20 - Missing Indexes in USER_FAVORITES collection
**Learning:** `USER_FAVORITES` collection was performing full table scans for all operations because no indexes were defined, despite relying on `error.code === 11000` to catch duplicate inserts in `MongoUserFavoriteRepository`.
**Action:** Always verify that collections relying on MongoDB unique index constraints for error handling actually have the underlying unique index created in `infrastructure/database/mongodb/indexes.ts`.
