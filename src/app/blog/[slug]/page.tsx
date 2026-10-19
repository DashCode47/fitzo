import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { WA_URL, WhatsAppIcon } from "@/lib/whatsapp";

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
      <main className="min-h-screen pt-28 md:pt-32 pb-20">
        <div className="wrap max-w-3xl">
          <Link href="/blog" className="inline-block rounded-full text-obsidian/60 hover:text-ember text-sm mb-10 transition-colors">
            ← Volver al blog
          </Link>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="tag">{post.readingTime}</span>
              <time dateTime={post.date} className="text-xs text-obsidian/60">
                {new Date(post.date).toLocaleDateString("es-EC", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </div>
            <h1 className="display text-[48px] md:text-[80px] mb-6">{post.title}</h1>
            <p className="text-obsidian/70 text-lg leading-[1.55]">{post.description}</p>
          </div>

          <hr className="divider mb-10" />

          <article className="prose-fitzo">
            <MDXRemote source={post.content} />
          </article>

          <div className="card-ember text-center mt-16">
            <p className="text-sm mb-3">¿Listo para transformar tu gimnasio?</p>
            <h2 className="display text-[48px] mb-8">Prueba Fitzo gratis hoy</h2>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="btn-primary bg-obsidian text-chalk hover:bg-chalk hover:text-obsidian">
              <WhatsAppIcon />
              Activar mi gimnasio gratis
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
