import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `https://fitzo.one/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://fitzo.one/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      images: post.coverImage ? [{ url: post.coverImage }] : [{ url: "/og-image.png" }],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-24 section-padding">
        <div className="max-w-3xl mx-auto">
          {/* Back */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/30 hover:text-gold text-sm mb-12 transition-colors"
          >
            ← Volver al blog
          </Link>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-5 text-xs text-white/30 font-medium uppercase tracking-widest">
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
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6">
              {post.title}
            </h1>
            <p className="text-white/50 text-lg leading-relaxed">
              {post.description}
            </p>
          </div>

          <hr className="border-white/[0.06] mb-12" />

          {/* MDX Content */}
          <article className="prose-fitzo">
            <MDXRemote source={post.content} />
          </article>

          <hr className="border-white/[0.06] mt-16 mb-12" />

          {/* CTA */}
          <div className="glass-card p-8 text-center">
            <p className="text-white/50 text-sm uppercase tracking-widest mb-3">
              ¿Listo para transformar tu gimnasio?
            </p>
            <h2 className="text-2xl font-black text-white mb-6">
              Prueba Fitzo gratis hoy
            </h2>
            <a
              href="https://wa.me/593978724619?text=Hola%2C%20me%20interesa%20una%20demo%20de%20Fitzo%20para%20mi%20gimnasio%20%F0%9F%92%AA"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2"
            >
              Activar mi gimnasio gratis
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
