# Two-user access test

The same check the "Who can see whose data?" card teaches. Record pass or fail for every step, for each twin.

1. Create accounts A and B.
2. As B, create a private record (for example an order). Note its URL and id.
3. As A, open B's record URL. **Pass:** not shown (404, 403 or redirect).
4. As A, replay the app's data request for B's id from the browser developer tools (change the id in the request). **Pass:** no data returned.
5. As A, try to update or delete B's record through the same request with a changed id. **Pass:** refused, and B's record is unchanged.
6. If the app queries the database from the browser (for example Supabase), query B's table directly with the public key while signed in as A. **Pass:** zero rows of B's data.

Each failed step counts as one high-severity finding in the `security-findings-high` metric.
