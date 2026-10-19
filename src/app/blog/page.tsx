import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "Blog — Consejos para Gimnasios",
  description:
    "Artículos sobre gestión de gimnasios, retención de miembros, gamificación fitness y tecnología para el sector gym en Latinoamérica.",
  alternates: { canonical: "https://fitzo.one/blog" },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 md:pt-32 pb-20">
        <div className="wrap">
          <div className="max-w-3xl mb-10 md:mb-14">
            <span className="tag">Blog</span>
            <h1 className="h2 mt-6 mb-6">Recursos para gimnasios modernos</h1>
            <p className="text-obsidian/70 text-lg max-w-xl">
              Estrategias, casos de éxito y tecnología para retener más miembros y hacer crecer tu gimnasio.
            </p>
          </div>

          {posts.length === 0 ? (
            <p className="text-obsidian/50">Próximamente...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="card group flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="tag">{post.readingTime}</span>
                    <time dateTime={post.date} className="text-xs text-obsidian/60">
                      {new Date(post.date).toLocaleDateString("es-EC", { year: "numeric", month: "long", day: "numeric" })}
                    </time>
                  </div>
                  <h2 className="display text-[32px] group-hover:text-ember transition-colors mb-4">{post.title}</h2>
                  <p className="text-obsidian/70 leading-[1.55] mb-8">{post.description}</p>
                  <span className="mt-auto text-ember">Leer artículo →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
