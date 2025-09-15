# Supabase Storage Setup

## Required Storage Bucket

To enable image uploads for job postings, you need to create a storage bucket in your Supabase project dashboard:

### 1. Create Storage Bucket
1. Go to your Supabase project dashboard
2. Navigate to Storage > Buckets
3. Create a new bucket with the name: `job-images`
4. Make the bucket **public** to allow image access

### 2. Set Bucket Policies (Optional)
For additional security, you can set up Row Level Security policies:

```sql
-- Allow anyone to view images
CREATE POLICY "Public can view job images" ON storage.objects 
FOR SELECT USING (bucket_id = 'job-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated can upload job images" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'job-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploaded images
CREATE POLICY "Users can update own job images" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'job-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Image Upload Process
The `useUploadJobImages` hook handles:
- Multiple image selection (up to 5 images)
- Image compression and resizing
- Upload to `job-images` bucket with job-specific folders
- Automatic URL generation and database update

### 4. Database Index (Already Created)
The schema already includes indexes for search performance:
- `idx_jobs_search` on (title, description) for text search
- `idx_jobs_tags` on tags array for tag filtering
- `idx_jobs_location` on location for location filtering

This enables efficient client-side filtering that can later be moved server-side as needed.