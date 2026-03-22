
-- seed_exercises.sql
-- Initial 20 exercises for Iron Body catalog

INSERT INTO public.exercises (name, muscle_group, equipment, description, image_url)
VALUES
('Sentadilla (Squat)', 'legs', 'barbell', 'Ejercicio compuesto de pierna', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800'),
('Press de Banca (Bench Press)', 'chest', 'barbell', 'Ejercicio compuesto de pecho', 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800'),
('Peso Muerto (Deadlift)', 'back', 'barbell', 'Ejercicio compuesto de cadena posterior', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800'),
('Dominadas (Pull-ups)', 'back', 'bodyweight', 'Ejercicio de tracción vertical', 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=800'),
('Press de Hombro (Shoulder Press)', 'shoulders', 'dumbbell', 'Ejercicio vertical de hombros', 'https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?q=80&w=800'),
('Prensa de Piernas (Leg Press)', 'legs', 'machine', 'Aislamiento y fuerza de piernas', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800'),
('Jalón al Pecho (Lat Pulldown)', 'back', 'machine', 'Aislamiento de dorsales', 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=800'),
('Press Inclinado (Incline Bench Press)', 'chest', 'dumbbell', 'Pecho superior', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800'),
('Zancadas (Lunges)', 'legs', 'dumbbell', 'Fuerza unilateral de piernas', 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?q=80&w=800'),
('Curl de Pierna (Leg Curl)', 'legs', 'machine', 'Aislamiento de isquios', null),
('Extensión de Tríceps (Tricep Pushdown)', 'arms', 'cable', 'Aislamiento de tríceps', null),
('Curl de Bíceps (Bicep Curl)', 'arms', 'dumbbell', 'Aislamiento de bíceps', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800'),
('Elevaciones Laterales (Lateral Raise)', 'shoulders', 'dumbbell', 'Cabeza lateral del hombro', null),
('Tirones a la Cara (Face Pull)', 'shoulders', 'cable', 'Hombro posterior y trapecio', null),
('Plancha (Plank)', 'core', 'bodyweight', 'Resistencia isométrica del núcleo', null),
('Extensión de Piernas (Leg Extension)', 'legs', 'machine', 'Aislamiento de cuádriceps', null),
('Remo con Barra (Barbell Row)', 'back', 'barbell', 'Fuerza horizontal de espalda', null),
('Aperturas de Pecho (Chest Fly)', 'chest', 'machine', 'Aislamiento pectoral', null),
('Curl Martillo (Hammer Curl)', 'arms', 'dumbbell', 'Bíceps y braquial', null),
('Sentadilla Búlgara (Bulgarian Split Squat)', 'legs', 'dumbbell', 'Cuádriceps e intensificador unilateral', null);
