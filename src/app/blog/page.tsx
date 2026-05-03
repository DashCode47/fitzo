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
      <main className="min-h-screen pt-32 pb-24 section-padding">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-16">
            <span className="text-gold text-xs font-bold tracking-[4px] uppercase">
              Blog
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white mt-3 mb-4">
              Recursos para{" "}
              <span className="gold-text">gimnasios modernos</span>
            </h1>
            <p className="text-white/50 text-lg max-w-xl">
              Estrategias, casos de éxito y tecnología para retener más miembros
              y hacer crecer tu gimnasio.
            </p>
          </div>

          {/* Posts grid */}
          {posts.length === 0 ? (
            <p className="text-white/30">Próximamente...</p>
          ) : (
            <div className="grid gap-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="glass-card p-8 group hover:border-gold/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-3 text-xs text-white/30 font-medium uppercase tracking-widest">
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("es-EC", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    <span>·</span>
                    <span>{post.readingTime}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white group-hover:text-gold transition-colors mb-3">
                    {post.title}
                  </h2>
                  <p className="text-white/50 leading-relaxed">
                    {post.description}
                  </p>
                  <span className="inline-block mt-5 text-gold text-sm font-semibold">
                    Leer artículo →
                  </span>
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
