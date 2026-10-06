-- ============================================================================
-- SQL Script: Clean up all users except alperen_k and insert 6 active fake users
-- ============================================================================

BEGIN;

-- 1. Identify alperen_k
DO $$
DECLARE
    alperen_id uuid;
BEGIN
    SELECT id INTO alperen_id FROM users WHERE username = 'alperen_k';
    IF alperen_id IS NULL THEN
        RAISE EXCEPTION 'User alperen_k not found!';
    END IF;
END $$;

-- 2. Delete test/junk lobbies
DELETE FROM lobbies 
WHERE name LIKE 'QA Arena%' 
   OR name LIKE 'Lobi Test%' 
   OR name = 'lkj' 
   OR name = 'Canlı Test Odası';

-- 3. Reassign ownership of any remaining lobbies to alperen_k temporarily
UPDATE lobbies 
SET owner_id = (SELECT id FROM users WHERE username = 'alperen_k')
WHERE owner_id != (SELECT id FROM users WHERE username = 'alperen_k');

-- 4. Delete messages from other users
DELETE FROM messages 
WHERE sender_id != (SELECT id FROM users WHERE username = 'alperen_k');

-- 5. Delete all users except alperen_k
DELETE FROM users 
WHERE username != 'alperen_k';

-- 6. Insert 6 realistic fake users
INSERT INTO users (
    id, username, email, password_hash, display_name, first_name, last_name,
    avatar_url, banner_url, bio, coins, is_bot, created_at, updated_at
) VALUES 
(
    'a1111111-1111-4111-8111-111111111111',
    'selin_tech',
    'selin_tech@lobby.ai',
    '$argon2id$v=19$m=19456,t=2,p=1$CDdqIhYHsKwMzhvcOE/lsg$oqzOiBGVkSVdc6pthgz4V20cHc9sLWVMbxETqhfBzwg',
    'Selin Yılmaz',
    'Selin',
    'Yılmaz',
    '/avatars/1.png',
    'theme:cyan',
    'Frontend mimarı & React tutkunu ⚛️ Pixel-perfect arayüzler ve animasyonlar.',
    350,
    false,
    NOW() - INTERVAL '7 days',
    NOW()
),
(
    'a2222222-2222-4222-8222-222222222222',
    'mert_celik',
    'mert_celik@lobby.ai',
    '$argon2id$v=19$m=19456,t=2,p=1$CDdqIhYHsKwMzhvcOE/lsg$oqzOiBGVkSVdc6pthgz4V20cHc9sLWVMbxETqhfBzwg',
    'Mert Çelik',
    'Mert',
    'Çelik',
    '/avatars/2.png',
    'theme:purple',
    'Rustacean & Sistem Mühendisi 🦀 Yüksek performanslı backend sistemleri.',
    420,
    false,
    NOW() - INTERVAL '6 days',
    NOW()
),
(
    'a3333333-3333-4333-8333-333333333333',
    'can_cyber',
    'can_cyber@lobby.ai',
    '$argon2id$v=19$m=19456,t=2,p=1$CDdqIhYHsKwMzhvcOE/lsg$oqzOiBGVkSVdc6pthgz4V20cHc9sLWVMbxETqhfBzwg',
    'Can Demir',
    'Can',
    'Demir',
    '/avatars/3.png',
    'theme:emerald',
    'Siber güvenlik araştırmacısı 🛡️ CTF oyuncusu ve terminal kurdu.',
    280,
    false,
    NOW() - INTERVAL '5 days',
    NOW()
),
(
    'a4444444-4444-4444-8444-444444444444',
    'dilara_pixel',
    'dilara_pixel@lobby.ai',
    '$argon2id$v=19$m=19456,t=2,p=1$CDdqIhYHsKwMzhvcOE/lsg$oqzOiBGVkSVdc6pthgz4V20cHc9sLWVMbxETqhfBzwg',
    'Dilara Aksoy',
    'Dilara',
    'Aksoy',
    '/avatars/4.png',
    'theme:pink',
    'UI/UX Tasarımcısı 🎨 Neo-Brutalism hayranı, Figma & CSS sevdalısı ☕',
    500,
    false,
    NOW() - INTERVAL '4 days',
    NOW()
),
(
    'a5555555-5555-4555-8555-555555555555',
    'baris_dev',
    'baris_dev@lobby.ai',
    '$argon2id$v=19$m=19456,t=2,p=1$CDdqIhYHsKwMzhvcOE/lsg$oqzOiBGVkSVdc6pthgz4V20cHc9sLWVMbxETqhfBzwg',
    'Barış Öztürk',
    'Barış',
    'Öztürk',
    '/avatars/5.png',
    'theme:yellow',
    'Full-stack geliştirici 🚀 Next.js & Axum ile ölçeklenebilir uygulamalar.',
    310,
    false,
    NOW() - INTERVAL '3 days',
    NOW()
),
(
    'a6666666-6666-4666-8666-666666666666',
    'zeynep_music',
    'zeynep_music@lobby.ai',
    '$argon2id$v=19$m=19456,t=2,p=1$CDdqIhYHsKwMzhvcOE/lsg$oqzOiBGVkSVdc6pthgz4V20cHc9sLWVMbxETqhfBzwg',
    'Zeynep Kaya',
    'Zeynep',
    'Kaya',
    '/avatars/6.png',
    'theme:sunset',
    'Lo-Fi prodüktörü & gamer 🎧 Gece kodlarken müzik üretiyorum.',
    450,
    false,
    NOW() - INTERVAL '2 days',
    NOW()
);

-- 7. Add memberships to existing lobbies for all 7 users
-- Insert alperen_k and fake users into all remaining lobbies
INSERT INTO lobby_members (lobby_id, user_id, role, notification_preference)
SELECT l.id, u.id, 
       CASE WHEN l.owner_id = u.id THEN 'OWNER' ELSE 'MEMBER' END,
       'ALL'
FROM lobbies l
CROSS JOIN users u
ON CONFLICT (lobby_id, user_id) DO NOTHING;

-- 8. Add mutual friendships (ACCEPTED) with alperen_k
INSERT INTO friend_requests (id, sender_id, receiver_id, status, created_at, updated_at)
VALUES
(
    gen_random_uuid(),
    'a1111111-1111-4111-8111-111111111111',
    (SELECT id FROM users WHERE username = 'alperen_k'),
    'ACCEPTED',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),
(
    gen_random_uuid(),
    'a2222222-2222-4222-8222-222222222222',
    (SELECT id FROM users WHERE username = 'alperen_k'),
    'ACCEPTED',
    NOW() - INTERVAL '1 days',
    NOW() - INTERVAL '1 days'
),
(
    gen_random_uuid(),
    'a4444444-4444-4444-8444-444444444444',
    (SELECT id FROM users WHERE username = 'alperen_k'),
    'ACCEPTED',
    NOW() - INTERVAL '18 hours',
    NOW() - INTERVAL '18 hours'
),
(
    gen_random_uuid(),
    'a3333333-3333-4333-8333-333333333333',
    (SELECT id FROM users WHERE username = 'alperen_k'),
    'ACCEPTED',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours'
)
ON CONFLICT DO NOTHING;

-- 9. Add engaging Direct Messages between alperen_k and fake users
INSERT INTO direct_messages (id, sender_id, receiver_id, content, is_read, created_at)
VALUES
(
    gen_random_uuid(),
    'a1111111-1111-4111-8111-111111111111',
    (SELECT id FROM users WHERE username = 'alperen_k'),
    'Selam Alperen! Yeni arayüz bileşenleri harika görünüyor 🚀',
    true,
    NOW() - INTERVAL '2 hours'
),
(
    gen_random_uuid(),
    (SELECT id FROM users WHERE username = 'alperen_k'),
    'a1111111-1111-4111-8111-111111111111',
    'Teşekkürler Selin! Avatarlar ve geçiş animasyonları da tamamlandı.',
    true,
    NOW() - INTERVAL '1 hour 45 minutes'
),
(
    gen_random_uuid(),
    'a1111111-1111-4111-8111-111111111111',
    (SELECT id FROM users WHERE username = 'alperen_k'),
    'Süper! Kahve Molası lobisinde görüşürüz ☕',
    false,
    NOW() - INTERVAL '20 minutes'
),
(
    gen_random_uuid(),
    'a2222222-2222-4222-8222-222222222222',
    (SELECT id FROM users WHERE username = 'alperen_k'),
    'Alperen selam, Axum WebSocket handler performansı gayet stabil çalışıyor 🦀',
    true,
    NOW() - INTERVAL '3 hours'
),
(
    gen_random_uuid(),
    (SELECT id FROM users WHERE username = 'alperen_k'),
    'a2222222-2222-4222-8222-222222222222',
    'Harika haber Mert, eline sağlık! Akşam kodlama odasında test ederiz.',
    true,
    NOW() - INTERVAL '2 hours 30 minutes'
);

-- 10. Add lively lobby messages across the active lobbies
INSERT INTO messages (lobby_id, sender_id, content, created_at, updated_at)
SELECT 
    l.id,
    'a1111111-1111-4111-8111-111111111111',
    'Selam herkese! Yeni özellikler çok akıcı çalışıyor 🎨',
    NOW() - INTERVAL '40 minutes',
    NOW() - INTERVAL '40 minutes'
FROM lobbies l
WHERE l.name LIKE '%Kahve%' OR l.name LIKE '%Tasarım%'
LIMIT 2;

INSERT INTO messages (lobby_id, sender_id, content, created_at, updated_at)
SELECT 
    l.id,
    'a2222222-2222-4222-8222-222222222222',
    'Rust 1.80 ile derleme süresi ve tip güvenliği zirveye çıktı 🦀',
    NOW() - INTERVAL '35 minutes',
    NOW() - INTERVAL '35 minutes'
FROM lobbies l
WHERE l.name LIKE '%Kodlama%' OR l.name LIKE '%Yapay%'
LIMIT 2;

INSERT INTO messages (lobby_id, sender_id, content, created_at, updated_at)
SELECT 
    l.id,
    'a4444444-4444-4444-8444-444444444444',
    'Neo-brutalist stilin kalın siyah kenarlıkları ve sert gölgeleri mükemmel oturmuş ✨',
    NOW() - INTERVAL '25 minutes',
    NOW() - INTERVAL '25 minutes'
FROM lobbies l
WHERE l.name LIKE '%Tasarım%' OR l.name LIKE '%Kahve%'
LIMIT 2;

INSERT INTO messages (lobby_id, sender_id, content, created_at, updated_at)
SELECT 
    l.id,
    'a6666666-6666-4666-8666-666666666666',
    'Gece kod yazarken Lo-Fi müzik açmayı unutmayın arkadaşlar 🎧🎶',
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '15 minutes'
FROM lobbies l
WHERE l.name LIKE '%Gece%' OR l.name LIKE '%Kahve%'
LIMIT 2;

INSERT INTO messages (lobby_id, sender_id, content, created_at, updated_at)
SELECT 
    l.id,
    'a5555555-5555-4555-8555-555555555555',
    'Yeni bir düelloya var mısınız? /zar atalım! 🎲',
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '5 minutes'
FROM lobbies l
WHERE l.name LIKE '%Oyun%' OR l.name LIKE '%Kahve%'
LIMIT 2;

COMMIT;
