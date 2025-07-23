-- Обновление роли пользователя на админа
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'admin') 
WHERE email = 'admin@example.com';

-- Проверка результата
SELECT u.email, r.name as role FROM users u 
JOIN roles r ON u.role_id = r.id; 