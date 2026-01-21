-- 1. Function to assign the best diet plan based on calorie target
create or replace function public.assign_best_diet_plan(p_user_id uuid, p_target_calories int)
returns void as $$
declare
    v_diet_id bigint;
begin
    -- Find the closest plan (Bucket)
    select id into v_diet_id
    from public.diet_plans
    order by abs(calories - p_target_calories) asc
    limit 1;

    -- Update or Insert into user_diets
    -- First deactivate old diets
    update public.user_diets 
    set active = false 
    where user_id = p_user_id;

    -- Insert new active diet
    if v_diet_id is not null then
        insert into public.user_diets (user_id, diet_plan_id, active)
        values (p_user_id, v_diet_id, true);
    end if;
end;
$$ language plpgsql security definer;

-- 2. Clean and Seed Master Plans (Expanded with Higher Calories)
truncate table public.diet_plans cascade;

INSERT INTO public.diet_plans (name, calories, macros, meals)
VALUES 
-- PLAN 1: DÉFICIT AGRESIVO
(
  'Déficit Inicial (1300 kcal)',
  1300,
  '{"protein": "110g", "carbs": "120g", "fats": "40g"}',
  '[
    {
      "title": "Desayuno",
      "options": [
        {"name": "Clásico Liviano", "foods": ["2 Huevos revueltos (sin aceite)", "1 Rebanada pan integral", "Café negro o Té"]},
        {"name": "Avena Express", "foods": ["30g Avena en agua", "Media manzana picada", "Canela"]}
      ]
    },
    {
      "title": "Almuerzo",
      "options": [
        {"name": "Pollo y Ensalada", "foods": ["120g Pechuga de pollo a la plancha", "100g Arroz cocido", "Ensalada verde libre (limón/sal)"]},
        {"name": "Atún Rápido", "foods": ["1 Lata de atún en agua", "2 Papas cocidas pequeñas", "Vegetales al vapor"]}
      ]
    },
    {
      "title": "Cena",
      "options": [
        {"name": "Merluza/Tilapia", "foods": ["150g Pescado blanco", "Ensalada mixta grande", "Medio aguacate pequeño"]},
        {"name": "Omelette de Claras", "foods": ["4 Claras de huevo", "Espinaca y tomate", "1 Tostada integral"]}
      ]
    }
  ]'::jsonb
),
-- PLAN 2: DÉFICIT MODERADO
(
  'Pérdida de Grasa (1600 kcal)',
  1600,
  '{"protein": "140g", "carbs": "160g", "fats": "50g"}',
  '[
    {
      "title": "Desayuno",
      "options": [
        {"name": "Tortilla de Huevo", "foods": ["2 Huevos enteros + 2 Claras", "1 Pan integral o arepa pequeña", "Fruta pequeña"]},
        {"name": "Bowl de Yogur", "foods": ["200ml Yogur Griego", "30g Granola", "Frutillas/Fresas"]}
      ]
    },
    {
      "title": "Almuerzo",
      "options": [
        {"name": "Carne Magra", "foods": ["120g Lomo de res magro", "150g Arroz o Pasta cocida", "Vegetales salteados"]},
        {"name": "Pollo con Menestra", "foods": ["120g Pollo", "80g Menestra (Lenteja/Frejol)", "80g Arroz", "Ensalada"]}
      ]
    },
    {
      "title": "Snack PM",
      "options": [
        {"name": "Fruta y Nueces", "foods": ["1 Manzana verde", "10 Almendras"]}
      ]
    },
    {
      "title": "Cena",
      "options": [
        {"name": "Wrap de Pollo", "foods": ["Tortilla integral", "100g Pollo desmechado", "Lechuga y tomate"]},
        {"name": "Ensalada César (Light)", "foods": ["150g Pollo", "Lechuga romana", "Crutones integrales", "Aderezo yogur"]}
      ]
    }
  ]'::jsonb
),
-- PLAN 3: MANTENIMIENTO ESTÁNDAR
(
  'Mantenimiento / Fitness (2000 kcal)',
  2000,
  '{"protein": "170g", "carbs": "220g", "fats": "65g"}',
  '[
    {
      "title": "Desayuno",
      "options": [
        {"name": "Desayuno Completo", "foods": ["3 Huevos revueltos", "2 Rebanadas pan integral", "Medio aguacate", "Café con leche descremada"]},
        {"name": "Avena Power", "foods": ["60g Avena", "Leche descremada", "1 Scoop proteína (opcional)", "Banana"]}
      ]
    },
    {
      "title": "Almuerzo",
      "options": [
        {"name": "Plato Típico Fitness", "foods": ["150g Pollo/Carne", "200g Arroz o Papa", "Medio maduro cocido", "Ensalada"]},
        {"name": "Pasta Boloñesa", "foods": ["150g Carne molida magra", "200g Pasta", "Salsa de tomate natural"]}
      ]
    },
    {
      "title": "Snack Pre-Entreno",
      "options": [
        {"name": "Sandwich", "foods": ["2 Pan integral", "Jamón de pavo", "Queso fresco"]},
        {"name": "Banana y Mantequilla", "foods": ["1 Banana", "1 Cucharada mantequilla de maní"]}
      ]
    },
    {
      "title": "Cena",
      "options": [
        {"name": "Pescado al Horno", "foods": ["180g Pescado", "2 Papas medianas", "Vegetales asados"]},
        {"name": "Burrito Bowl", "foods": ["100g Carne molida", "Arroz, Frejol negro, Pico de gallo"]}
      ]
    }
  ]'::jsonb
),
-- PLAN 4: SUPERÁVIT LIGERO
(
  'Ganancia Muscular (2400 kcal)',
  2400,
  '{"protein": "190g", "carbs": "280g", "fats": "75g"}',
  '[
    {
      "title": "Desayuno",
      "options": [
        {"name": "Huevos Rancheros", "foods": ["4 Huevos", "2 Tortillas de maíz/trigo", "Frejoles refritos", "Salsa"]},
        {"name": "Licuado Mass Gainer (Casero)", "foods": ["Leche entera", "1 Banana", "60g Avena", "Mantequilla de maní", "Scoop Proteína"]}
      ]
    },
    {
      "title": "Almuerzo",
      "options": [
        {"name": "Almuerzo Ejecutivo Gym", "foods": ["180g Carne/Pollo", "250g Arroz blanco", "Aguacate entero", "Menestra"]},
        {"name": "Lasaña de Carne", "foods": ["Porción grande de lasaña de carne", "Ensalada verde"]}
      ]
    },
    {
      "title": "Snack PM",
      "options": [
        {"name": "Yogur Cargado", "foods": ["Yogur Griego", "50g Granola", "Miel", "Fruta"]}
      ]
    },
    {
      "title": "Cena",
      "options": [
        {"name": "Hamburguesa Casera", "foods": ["150g Carne magra", "Pan de hamburguesa", "Queso, lechuga, tomate", "Papas al horno"]},
        {"name": "Pollo y Camote", "foods": ["180g Pollo", "300g Camote al horno", "Aceite de oliva"]}
      ]
    }
  ]'::jsonb
),
-- PLAN 5: VOLUMEN ALTO
(
  'Alto Rendimiento: Volumen Limpio (2800 kcal)',
  2800,
  '{"protein": "210g", "carbs": "340g", "fats": "70g"}',
  '[
    {
      "title": "Desayuno",
      "time": "07:00 AM",
      "options": [
        {"name": "Power Oats", "foods": ["100g Avena cocida en leche", "1 Scoop Proteína o 5 Claras", "1 Banana", "Canela"]},
        {"name": "Tostadas Francesas Fit", "foods": ["4 Rebanadas pan integral", "Mezcla de huevo y leche", "Miel de maple sin azúcar", "Frutillas"]}
      ]
    },
    {
      "title": "Almuerzo",
      "time": "01:00 PM",
      "options": [
        {"name": "Pollo y Camote", "foods": ["200g Pechuga de Pollo", "300g Camote/Papa al horno", "Vegetales salteados", "1 Cda Aceite Oliva"]},
        {"name": "Lomo Salteado", "foods": ["200g Lomo fino", "250g Arroz blanco", "Tomate, cebolla y pimiento", "Papas fritas (airfryer)"]}
      ]
    },
    {
      "title": "Pre-Entreno",
      "time": "05:00 PM",
      "options": [
        {"name": "Energía Rápida", "foods": ["Crema de Arroz o Maizena", "1 Scoop Proteína", "Mermelada"]}
      ]
    },
    {
      "title": "Cena",
      "time": "09:00 PM",
      "options": [
        {"name": "Pescado y Quinoa", "foods": ["200g Tilapia/Corvina", "200g Quinoa cocida", "Aguacate mediano"]}
      ]
    }
  ]'::jsonb
),
-- PLAN 6: SUPER VOLUMEN (3200 kcal)
(
  'Super Volumen (3200 kcal)',
  3200,
  '{"protein": "230g", "carbs": "420g", "fats": "95g"}',
  '[
    {
      "title": "Desayuno",
      "options": [
        {"name": "Desayuno Gigante", "foods": ["5 Huevos", "120g Avena", "2 Tostadas", "Mantequilla de maní"]}
      ]
    },
    {
      "title": "Media Mañana",
      "options": [
        {"name": "Mass Shake", "foods": ["Leche entera", "2 Scoops Proteína", "Banana", "40g Avena"]}
      ]
    },
    {
      "title": "Almuerzo",
      "options": [
        {"name": "Bandeja Paisa Fitness", "foods": ["250g Carne", "350g Arroz", "Menestra", "Aguacate", "Huevo extra"]}
      ]
    },
    {
      "title": "Merienda",
      "options": [
        {"name": "Yogur y Frutos Secos", "foods": ["Yogur Griego XL", "80g Granola", "30g Nueces"]}
      ]
    },
    {
      "title": "Cena",
      "options": [
        {"name": "Festín de Pollo", "foods": ["300g Pollo", "250g Papa", "Vegetales salteados en oliva"]}
      ]
    }
  ]'::jsonb
),
-- PLAN 7: ATLETA ÉLITE (3500 kcal)
(
  'Atleta Élite / Bulk Máximo (3500 kcal)',
  3500,
  '{"protein": "250g", "carbs": "480g", "fats": "110g"}',
  '[
    {
      "title": "Desayuno",
      "options": [
        {"name": "Desayuno Pro", "foods": ["6 Huevos", "150g Avena", "Miel", "Nueces", "Café"]}
      ]
    },
    {
      "title": "Media Mañana",
      "options": [
        {"name": "Sándwich Doble Pro", "foods": ["4 Rebanadas pan", "150g Pavo", "Queso crema", "Banana"]}
      ]
    },
    {
      "title": "Almuerzo",
      "options": [
        {"name": "Carga de Carbos", "foods": ["300g Carne/Pollo", "400g Arroz", "Legumbres", "Ensalada", "Aceite Oliva"]}
      ]
    },
    {
      "title": "Merienda",
      "options": [
        {"name": "Gainer Shake", "foods": ["500ml Leche", "Scoop Proteína", "Avena", "Dátiles", "Mantequilla Maní"]}
      ]
    },
    {
      "title": "Cena",
      "options": [
        {"name": "Pasta y Proteína", "foods": ["300g Pasta", "250g Pechuga de pollo", "Salsa pesto", "Parmeseano"]}
      ]
    }
  ]'::jsonb
);
