
-- Drop the foreign key constraint on reviews.user_id if it exists
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

-- Insert sample approved reviews (user_id will be random UUIDs for demo purposes)
INSERT INTO reviews (user_id, service_id, rating, content, approved) VALUES
  (gen_random_uuid(), 'dddb16d2-bac8-49f0-8c23-b204b82347ac', 5, 'Absolutely love my nails! El is so talented and always makes sure I leave feeling beautiful. The attention to detail is incredible.', true),
  (gen_random_uuid(), '57b68321-8758-4e79-bdb5-b5df11fa7b82', 5, 'Best lash extensions I have ever had! They look so natural and last for weeks. Highly recommend El''s Beauty Studio!', true),
  (gen_random_uuid(), '2c13ae34-b01e-4292-acc4-3bce3db58b71', 5, 'The nail art designs are stunning! El really listens to what you want and delivers beyond expectations. Will definitely be back!', true),
  (gen_random_uuid(), 'dddb16d2-bac8-49f0-8c23-b204b82347ac', 5, 'Such a relaxing experience every time. The studio is beautiful and El is so professional. My go-to for all things beauty!', true),
  (gen_random_uuid(), '57b68321-8758-4e79-bdb5-b5df11fa7b82', 4, 'Amazing lashes that look so natural! El takes her time to make sure everything is perfect. Worth every penny.', true),
  (gen_random_uuid(), '2c13ae34-b01e-4292-acc4-3bce3db58b71', 4, 'Great service and beautiful results. The booking process was easy and the studio has such a welcoming atmosphere.', true);
