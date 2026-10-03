import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { HeroSceneLoader } from "@/components/hero-scene-loader";

const pathways = [
  { number: "01", title: "Make your work visible", body: "Build a considered professional profile, bring your work together, and give every credit its context.", link: "Create your profile", href: "/signup" },
  { number: "02", title: "Meet your people", body: "Find the makers behind the work by craft, place, project, and the way they like to collaborate.", link: "Explore creatives", href: "/connect" },
  { number: "03", title: "Find what comes next", body: "Discover open calls, thoughtful collaborations, new work, and conversations from across the industry.", link: "Browse opportunities", href: "/jobs" },
];

export default function Home() {
  return (
    <main>
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow">A home for creative practice</span>
          <h1>Where creative<br />people <em>meet.</em></h1>
          <p>Build your professional identity, share the work you care about, and find the people who will help shape what comes next.</p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/signup">Create your profile <ArrowRight size={16} /></Link>
            <Link className="button button-outline" href="/discover">Explore creative work <ArrowUpRight size={16} /></Link>
          </div>
          <div className="hero-meta"><span className="hero-meta-line" /> CREATE <span>·</span> CONNECT <span>·</span> DISCOVER</div>
        </div>
        <div className="hero-art" aria-label="An artist working on a film set">
          <div className="hero-photo" aria-hidden="true" />
          <div className="hero-frame" />
          <HeroSceneLoader />
          <div className="hero-note">Every frame begins somewhere.<b>MAKE ROOM FOR YOURS</b></div>
          <div className="hero-stamp"><strong>Made<br />together.</strong><span>INDEPENDENT BY NATURE</span></div>
        </div>
      </section>

      <div className="rail" aria-label="Creative disciplines">
        <span>Film</span><span>Performance</span><span>Photography</span><span>Sound</span><span>Design</span><span>Writing</span><span>And the spaces between</span>
      </div>

      <section className="home-section">
        <div className="section-heading">
          <div><span className="eyebrow">A creative network, with the work at its heart</span><h2>One practice. Many ways in.</h2></div>
          <p>A professional home for the people who make culture: from first idea to finished frame, and every collaborator along the way.</p>
        </div>
        <div className="loop-grid">
          {pathways.map((item) => (
            <article className="loop-cell" key={item.number}>
              <span className="loop-index">{item.number}</span>
              <h3>{item.title}</h3><p>{item.body}</p>
              <Link href={item.href}>{item.link}<ArrowRight size={15} /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="home-editorial">
        <div><span className="editorial-mark">“</span><blockquote>Good work changes when the right people find each other.</blockquote></div>
        <div className="editorial-side">A considered space for independent voices, trusted credits, and work made with intention. <br /><Link className="button button-dark" href="/about">Our point of view <ArrowDown size={15} /></Link></div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div><span className="eyebrow">A place to begin</span><h2>Bring your practice into focus.</h2></div>
          <p>Start with your craft and the work you have made. The community grows from there.</p>
        </div>
        <div className="hero-actions">
          <Link className="button button-dark" href="/signup">Join ART & ARTIST <ArrowRight size={16} /></Link>
          <Link className="button button-outline" href="/journal">Read the journal <ArrowUpRight size={16} /></Link>
        </div>
      </section>
    </main>
  );
}
