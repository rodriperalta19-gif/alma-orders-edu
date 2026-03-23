# 🎓 Academia Alma Orders

Plataforma educativa tipo "mini Udemy" integrada en el ecosistema Alma Orders.

## Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Auth)
- **Video:** Vimeo / YouTube (embed vía iframe)
- **Design System:** "The Scholarly Atelier" — Manrope + Work Sans, verdes #00450d

---

## Setup en 5 pasos

### 1. Ejecutar el SQL en Supabase
1. Abrí tu dashboard: https://supabase.com/dashboard/project/dymkkakxqqebblnbauom
2. Ir a **SQL Editor → New Query**
3. Pegar y ejecutar el contenido de `supabase-schema.sql`

### 2. Convertirte en Admin
En el SQL Editor, ejecutar:
```sql
update public.profiles set role = 'admin' 
where id = (select id from auth.users where email = 'TU_EMAIL@ejemplo.com');
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```
Abrí http://localhost:3000

### 5. Deploy en Vercel
```bash
npx vercel --prod
```
Agregar las variables de entorno en Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Rutas de la aplicación

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/auth` | Login / Registro | Público |
| `/catalog` | Catálogo de cursos | Autenticado |
| `/course/[id]` | Detalle del curso + temario | Autenticado |
| `/learn/[courseId]/[lessonId]` | Reproductor de video | Autenticado |
| `/admin` | Panel admin con estadísticas | Solo admin |
| `/admin/courses/[id]` | Editor de curso (módulos + lecciones) | Solo admin |

---

## Flujo de videos Vimeo

El reproductor acepta:
- URLs de Vimeo: `https://vimeo.com/123456789`
- URLs de YouTube: `https://www.youtube.com/watch?v=XXXXX` o `https://youtu.be/XXXXX`
- URLs de player directo: `https://player.vimeo.com/video/123456789`

---

## Estructura del proyecto

```
alma-orders-edu/
├── app/
│   ├── auth/page.tsx          # Login + Registro
│   ├── catalog/page.tsx       # Catálogo de cursos
│   ├── course/[id]/page.tsx   # Detalle del curso
│   ├── learn/[courseId]/[lessonId]/page.tsx  # Reproductor
│   ├── admin/page.tsx         # Panel admin
│   └── admin/courses/[id]/page.tsx  # Editor de curso
├── components/
│   └── layout/Navbar.tsx
├── lib/
│   ├── supabase.ts            # Cliente (componentes)
│   └── supabase-server.ts     # Cliente (server)
├── types/
│   └── database.ts            # Tipos TypeScript del schema
└── supabase-schema.sql        # SQL para ejecutar en Supabase
```
