# Please check the Connection String options

In your Supabase dashboard at Settings → Database:

Look for the "Connection String" section (usually near the top).

You should see a dropdown or tabs with options like:
- URI
- JDBC
- .NET
- etc.

Can you:
1. Click on the "URI" option
2. Look for any other tabs/dropdowns that say:
   - "Pooler" 
   - "Session mode"
   - "Transaction mode"
   - "Direct connection"

3. Tell me EXACTLY what options you see in that dropdown/tabs?

4. If you see "Pooler" or "Session mode", copy that connection string for me (with the password hidden as [PASSWORD])

The format might look like:
- postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

OR it might just be:
- postgresql://postgres:[PASSWORD]@db.qqqirayxskimjfutudoy.supabase.co:5432/postgres
